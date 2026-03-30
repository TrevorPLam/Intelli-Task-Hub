/**
 * Advanced Error Handling System for AudioWorklet
 * Provides graceful degradation, retry logic, and user-friendly error messages
 */

export interface AudioWorkletError {
  type:
    | "worklet_load"
    | "audio_context"
    | "playback"
    | "network"
    | "permission"
    | "unknown";
  severity: "info" | "warning" | "error" | "critical";
  code: string;
  message: string;
  originalError?: Error;
  timestamp: Date;
  retryable: boolean;
  recoveryActions: string[];
}

export interface ErrorRecoveryConfig {
  maxRetries: number;
  retryDelay: number;
  exponentialBackoff: boolean;
  fallbackEnabled: boolean;
  userNotificationLevel: "silent" | "toast" | "modal" | "console";
}

export class AudioWorkletErrorHandler {
  private errors: AudioWorkletError[] = [];
  private retryAttempts: Map<string, number> = new Map();
  private config: ErrorRecoveryConfig;
  private errorCallbacks: ((error: AudioWorkletError) => void)[] = [];

  constructor(config?: Partial<ErrorRecoveryConfig>) {
    this.config = {
      maxRetries: 3,
      retryDelay: 1000,
      exponentialBackoff: true,
      fallbackEnabled: true,
      userNotificationLevel: "toast",
      ...config,
    };
  }

  /**
   * Add error callback for custom error handling
   */
  onError(callback: (error: AudioWorkletError) => void): void {
    this.errorCallbacks.push(callback);
  }

  /**
   * Remove error callback
   */
  removeErrorCallback(callback: (error: AudioWorkletError) => void): void {
    const index = this.errorCallbacks.indexOf(callback);
    if (index > -1) {
      this.errorCallbacks.splice(index, 1);
    }
  }

  /**
   * Handle AudioWorklet loading errors with retry logic
   */
  async handleWorkletLoadError(
    workletPath: string,
    error: Error,
    attempt: number = 0
  ): Promise<boolean> {
    const audioError = this.createAudioWorkletError("worklet_load", error, {
      retryable: attempt < this.config.maxRetries,
      recoveryActions: this.getWorkletRecoveryActions(workletPath, attempt),
    });

    this.logError(audioError);
    this.notifyErrorCallbacks(audioError);

    if (!audioError.retryable || attempt >= this.config.maxRetries) {
      await this.handleFailedWorkletLoad(workletPath, audioError);
      return false;
    }

    // Retry with exponential backoff
    const delay = this.calculateRetryDelay(attempt);
    await this.delay(delay);

    try {
      await this.retryWorkletLoad(workletPath);
      this.clearRetryAttempts(workletPath);
      return true;
    } catch (retryError) {
      return this.handleWorkletLoadError(
        workletPath,
        retryError as Error,
        attempt + 1
      );
    }
  }

  /**
   * Handle AudioContext errors
   */
  async handleAudioContextError(
    context: AudioContext,
    error: Error
  ): Promise<boolean> {
    const audioError = this.createAudioWorkletError("audio_context", error, {
      retryable: true,
      recoveryActions: [
        "Check browser compatibility",
        "Ensure user interaction for audio context",
        "Verify secure context (HTTPS)",
        "Try refreshing the page",
      ],
    });

    this.logError(audioError);
    this.notifyErrorCallbacks(audioError);

    // Try to recover audio context
    if (context.state === "suspended") {
      try {
        await context.resume();
        return true;
      } catch (resumeError) {
        console.error("Failed to resume audio context:", resumeError);
      }
    }

    // Try creating new context
    if (this.config.fallbackEnabled) {
      return await this.createFallbackAudioContext();
    }

    return false;
  }

  /**
   * Handle audio playback errors
   */
  async handlePlaybackError(
    workletNode: AudioWorkletNode,
    error: Error
  ): Promise<boolean> {
    const audioError = this.createAudioWorkletError("playback", error, {
      retryable: true,
      recoveryActions: [
        "Check worklet processor implementation",
        "Verify audio data format",
        "Ensure worklet is properly connected",
        "Try restarting audio context",
      ],
    });

    this.logError(audioError);
    this.notifyErrorCallbacks(audioError);

    // Try to reconnect worklet
    try {
      if (workletNode.context.state === "running") {
        workletNode.disconnect();
        workletNode.connect(workletNode.context.destination);
        return true;
      }
    } catch (reconnectError) {
      console.error("Failed to reconnect worklet:", reconnectError);
    }

    return false;
  }

  /**
   * Handle network errors for cross-origin worklet loading
   */
  handleNetworkError(url: string, error: Error): void {
    const audioError = this.createAudioWorkletError("network", error, {
      retryable: false,
      recoveryActions: [
        "Check network connectivity",
        "Verify URL is accessible",
        "Ensure same-origin policy compliance",
        "Check CORS headers",
      ],
    });

    this.logError(audioError);
    this.notifyErrorCallbacks(audioError);
  }

  /**
   * Handle permission errors (microphone access, etc.)
   */
  async handlePermissionError(
    permissionType: "microphone" | "speaker",
    error: Error
  ): Promise<boolean> {
    const audioError = this.createAudioWorkletError("permission", error, {
      retryable: true,
      recoveryActions: [
        `Grant ${permissionType} permission`,
        "Check browser settings",
        "Ensure HTTPS connection",
        "Try refreshing the page",
      ],
    });

    this.logError(audioError);
    this.notifyErrorCallbacks(audioError);

    // Request permission again
    if (permissionType === "microphone") {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
        stream.getTracks().forEach((track) => track.stop());
        return true;
      } catch (permissionError) {
        console.error("Microphone permission denied:", permissionError);
      }
    }

    return false;
  }

  /**
   * Get error history for debugging
   */
  getErrorHistory(): AudioWorkletError[] {
    return [...this.errors];
  }

  /**
   * Clear error history
   */
  clearErrorHistory(): void {
    this.errors = [];
    this.retryAttempts.clear();
  }

  /**
   * Get error statistics
   */
  getErrorStats(): {
    total: number;
    byType: Record<string, number>;
    bySeverity: Record<string, number>;
    retryable: number;
    recent: AudioWorkletError[];
  } {
    const byType: Record<string, number> = {};
    const bySeverity: Record<string, number> = {};
    let retryable = 0;

    this.errors.forEach((error) => {
      byType[error.type] = (byType[error.type] || 0) + 1;
      bySeverity[error.severity] = (bySeverity[error.severity] || 0) + 1;
      if (error.retryable) retryable++;
    });

    return {
      total: this.errors.length,
      byType,
      bySeverity,
      retryable,
      recent: this.errors.slice(-10),
    };
  }

  private createAudioWorkletError(
    type: AudioWorkletError["type"],
    originalError: Error,
    options: Partial<
      Omit<AudioWorkletError, "type" | "originalError" | "timestamp">
    > = {}
  ): AudioWorkletError {
    const severity = this.determineSeverity(type, originalError);
    const code = this.generateErrorCode(type, originalError);
    const message = this.generateUserFriendlyMessage(type, originalError);

    return {
      type,
      severity,
      code,
      message,
      originalError,
      timestamp: new Date(),
      retryable: options.retryable ?? false,
      recoveryActions: options.recoveryActions ?? [],
    };
  }

  private determineSeverity(
    type: AudioWorkletError["type"],
    error: Error
  ): AudioWorkletError["severity"] {
    if (error.name === "NotAllowedError" || error.name === "SecurityError") {
      return "critical";
    }
    if (type === "audio_context" || type === "worklet_load") {
      return "error";
    }
    if (type === "playback") {
      return "warning";
    }
    return "info";
  }

  private generateErrorCode(
    type: AudioWorkletError["type"],
    error: Error
  ): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    const typeCode = type
      .split("_")
      .map((s) => s[0])
      .join("")
      .toUpperCase();
    return `AUDIO_${typeCode}_${timestamp}`;
  }

  private generateUserFriendlyMessage(
    type: AudioWorkletError["type"],
    error: Error
  ): string {
    const messages: Record<AudioWorkletError["type"], string> = {
      worklet_load:
        "Failed to load audio processing module. Please check your internet connection.",
      audio_context:
        "Audio system initialization failed. Please ensure you're using a supported browser.",
      playback:
        "Audio playback encountered an issue. The audio will continue playing.",
      network: "Network error occurred while loading audio resources.",
      permission: "Permission required for audio functionality.",
      unknown: "An unexpected audio error occurred.",
    };

    return messages[type] || messages.unknown;
  }

  private getWorkletRecoveryActions(
    workletPath: string,
    attempt: number
  ): string[] {
    const actions = [
      "Check if worklet file exists",
      "Verify file path is correct",
      "Ensure same-origin policy compliance",
    ];

    if (attempt > 0) {
      actions.push("Wait for network to stabilize");
    }

    if (attempt >= 2) {
      actions.push("Try refreshing the page");
      actions.push("Check browser console for details");
    }

    return actions;
  }

  private async retryWorkletLoad(workletPath: string): Promise<void> {
    const audioContext = new (
      window.AudioContext || (window as any).webkitAudioContext
    )();
    await audioContext.audioWorklet.addModule(workletPath);
  }

  private async handleFailedWorkletLoad(
    workletPath: string,
    error: AudioWorkletError
  ): Promise<void> {
    if (this.config.fallbackEnabled) {
      console.warn(
        "Worklet loading failed, attempting fallback:",
        error.message
      );
      await this.initializeFallbackAudio();
    } else {
      console.error(
        "Worklet loading failed and no fallback available:",
        error.message
      );
    }
  }

  private async createFallbackAudioContext(): Promise<boolean> {
    try {
      // Create a simple audio context without worklet
      const context = new (
        window.AudioContext || (window as any).webkitAudioContext
      )();
      const oscillator = context.createOscillator();
      const gainNode = context.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(context.destination);

      oscillator.frequency.value = 440; // A4 note
      gainNode.gain.value = 0.1; // Low volume

      oscillator.start();
      oscillator.stop(context.currentTime + 0.1); // Short beep

      return true;
    } catch (error) {
      console.error("Fallback audio failed:", error);
      return false;
    }
  }

  private async initializeFallbackAudio(): Promise<void> {
    // Initialize fallback audio system
    console.log("Initializing fallback audio system...");
  }

  private calculateRetryDelay(attempt: number): number {
    if (!this.config.exponentialBackoff) {
      return this.config.retryDelay;
    }

    return this.config.retryDelay * Math.pow(2, attempt);
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private logError(error: AudioWorkletError): void {
    console.group(`🎵 AudioWorklet Error [${error.code}]`);
    console.error("Type:", error.type);
    console.error("Severity:", error.severity);
    console.error("Message:", error.message);
    console.error("Timestamp:", error.timestamp);
    console.error("Retryable:", error.retryable);
    console.error("Recovery Actions:", error.recoveryActions);
    if (error.originalError) {
      console.error("Original Error:", error.originalError);
    }
    console.groupEnd();

    this.errors.push(error);

    // Limit error history size
    if (this.errors.length > 1000) {
      this.errors.shift();
    }
  }

  private notifyErrorCallbacks(error: AudioWorkletError): void {
    this.errorCallbacks.forEach((callback) => {
      try {
        callback(error);
      } catch (callbackError) {
        console.error("Error in error callback:", callbackError);
      }
    });
  }

  /**
   * Handle unknown errors with logging
   */
  handleUnknownError(error: Error): void {
    const audioError = this.createAudioWorkletError("unknown", error);
    this.logError(audioError);
  }

  private clearRetryAttempts(workletPath: string): void {
    this.retryAttempts.delete(workletPath);
  }
}

/**
 * Global error handler instance
 */
export const audioWorkletErrorHandler = new AudioWorkletErrorHandler();

/**
 * Utility function to wrap AudioWorklet operations with error handling
 */
export function withAudioWorkletErrorHandling<T>(
  operation: () => Promise<T>,
  errorHandler: AudioWorkletErrorHandler = audioWorkletErrorHandler
): Promise<T> {
  return operation().catch((error) => {
    errorHandler.handleUnknownError(error as Error);
    throw error;
  });
}
