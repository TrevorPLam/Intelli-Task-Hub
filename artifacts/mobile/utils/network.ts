/**
 * Network Resilience Utilities
 *
 * Provides timeout, retry logic, and offline detection for network requests.
 * Follows React Native performance and security best practices 2026.
 */

export interface NetworkRequestOptions {
  timeout?: number;
  maxRetries?: number;
  retryDelay?: number;
  enableBackoff?: boolean;
}

export interface NetworkResponse<T> {
  data?: T;
  error?: Error;
  status: "success" | "error" | "timeout";
  retryCount?: number;
}

/**
 * Default network configuration
 */
const DEFAULT_OPTIONS: Required<NetworkRequestOptions> = {
  timeout: 10000, // 10 seconds
  maxRetries: 3,
  retryDelay: 1000, // 1 second
  enableBackoff: true,
};

/**
 * Exponential backoff calculation
 */
function calculateBackoffDelay(retryCount: number, baseDelay: number): number {
  return Math.min(baseDelay * Math.pow(2, retryCount), 30000); // Max 30 seconds
}

/**
 * Check network connectivity (simplified version without external dependencies)
 */
export async function isNetworkAvailable(): Promise<boolean> {
  try {
    // Simple connectivity check - can be enhanced with @react-native-netinfo/netinfo later
    const response = await fetch("https://httpbin.org/get", {
      method: "HEAD",
    });
    return response.ok;
  } catch (error) {
    console.warn("Network check failed:", error);
    return false; // Assume offline on error
  }
}

/**
 * Enhanced fetch with timeout and retry logic
 */
export async function resilientFetch<T = any>(
  url: string,
  options: RequestInit & NetworkRequestOptions = {}
): Promise<NetworkResponse<T>> {
  const mergedOptions = { ...DEFAULT_OPTIONS, ...options };
  let retryCount = 0;

  while (retryCount <= mergedOptions.maxRetries) {
    try {
      // Check network connectivity before attempting request
      if (!(await isNetworkAvailable())) {
        return {
          error: new Error("Network unavailable"),
          status: "error",
          retryCount,
        };
      }

      // Create AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(
        () => controller.abort(),
        mergedOptions.timeout
      );

      try {
        const response = await fetch(url, {
          ...options,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();

        return {
          data,
          status: "success",
          retryCount,
        };
      } catch (fetchError) {
        clearTimeout(timeoutId);
        throw fetchError;
      }
    } catch (error) {
      const isTimeout = error instanceof Error && error.name === "AbortError";
      const shouldRetry = retryCount < mergedOptions.maxRetries;

      if (!shouldRetry) {
        return {
          error: error as Error,
          status: isTimeout ? "timeout" : "error",
          retryCount,
        };
      }

      // Calculate delay for next retry
      const delay = mergedOptions.enableBackoff
        ? calculateBackoffDelay(retryCount, mergedOptions.retryDelay)
        : mergedOptions.retryDelay;

      console.warn(
        `Request failed (attempt ${retryCount + 1}/${mergedOptions.maxRetries + 1}), retrying in ${delay}ms:`,
        error
      );

      // Wait before retry
      await new Promise<void>((resolve) => setTimeout(resolve, delay));
      retryCount++;
    }
  }

  return {
    error: new Error(
      `Request failed after ${mergedOptions.maxRetries + 1} attempts`
    ),
    status: "error",
    retryCount,
  };
}

/**
 * Queue for offline requests
 */
interface QueuedRequest {
  id: string;
  url: string;
  options: RequestInit & NetworkRequestOptions;
  resolve: (response: NetworkResponse<any>) => void;
  reject: (error: Error) => void;
  timestamp: number;
}

class RequestQueue {
  private queue: QueuedRequest[] = [];
  private isProcessing = false;

  add(
    request: Omit<QueuedRequest, "id" | "timestamp">
  ): Promise<NetworkResponse<any>> {
    return new Promise((resolve, reject) => {
      const queuedRequest: QueuedRequest = {
        ...request,
        id: Math.random().toString(36).substr(2, 9),
        timestamp: Date.now(),
        resolve,
        reject,
      };

      this.queue.push(queuedRequest);
      this.processQueue();
    });
  }

  private async processQueue() {
    if (this.isProcessing || this.queue.length === 0) {
      return;
    }

    this.isProcessing = true;

    while (this.queue.length > 0) {
      const request = this.queue.shift()!;

      try {
        const response = await resilientFetch(request.url, request.options);
        request.resolve(response);
      } catch (error) {
        request.reject(error as Error);
      }
    }

    this.isProcessing = false;
  }

  clear() {
    this.queue = [];
    this.isProcessing = false;
  }

  getQueueLength(): number {
    return this.queue.length;
  }
}

export const requestQueue = new RequestQueue();

/**
 * Network status monitoring (simplified version)
 */
export class NetworkMonitor {
  private listeners: ((isOnline: boolean) => void)[] = [];
  private currentStatus: boolean = true;
  private monitoringInterval?: ReturnType<typeof setInterval>;

  constructor() {
    this.startMonitoring();
  }

  private startMonitoring() {
    // Initial status check
    isNetworkAvailable().then((isOnline) => {
      this.currentStatus = isOnline;
      this.notifyListeners(isOnline);
    });

    // Poll for network changes every 30 seconds
    this.monitoringInterval = setInterval(async () => {
      const isOnline = await isNetworkAvailable();
      if (isOnline !== this.currentStatus) {
        this.currentStatus = isOnline;
        this.notifyListeners(isOnline);
      }
    }, 30000);
  }

  private notifyListeners(isOnline: boolean) {
    this.listeners.forEach((listener) => listener(isOnline));
  }

  subscribe(listener: (isOnline: boolean) => void) {
    this.listeners.push(listener);
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  isOnline(): boolean {
    return this.currentStatus;
  }

  cleanup() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }
  }
}

export const networkMonitor = new NetworkMonitor();
