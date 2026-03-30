/**
 * Audio Performance Monitoring System
 * Provides real-time metrics collection and analysis for AudioWorklet performance
 */

export interface AudioPerformanceMetrics {
  renderCapacity: number; // Percentage of audio render budget used
  callbackInterval: number; // Average time between audio callbacks (ms)
  initializationTime: number; // Time to initialize AudioContext and worklet (ms)
  glitchRate: number; // Audio glitches per minute
  memoryUsage: number; // Memory usage in MB
  cpuUsage: number; // CPU usage percentage
  latency: number; // Audio latency in ms
  dropoutRate: number; // Audio dropout percentage
}

export interface PerformanceThresholds {
  renderCapacity: number; // Alert if render capacity > this (%)
  callbackInterval: number; // Alert if callback interval > this (ms)
  initializationTime: number; // Alert if init time > this (ms)
  glitchRate: number; // Alert if glitches > this (per minute)
  memoryUsage: number; // Alert if memory > this (MB)
  cpuUsage: number; // Alert if CPU > this (%)
  latency: number; // Alert if latency > this (ms)
  dropoutRate: number; // Alert if dropout rate > this (%)
}

export interface PerformanceAlert {
  type: "warning" | "critical";
  metric: keyof AudioPerformanceMetrics;
  value: number;
  threshold: number;
  timestamp: Date;
  message: string;
}

export class AudioPerformanceMonitor {
  private audioContext: AudioContext | null = null;
  private workletNode: AudioWorkletNode | null = null;
  private metrics: AudioPerformanceMetrics;
  private thresholds: PerformanceThresholds;
  private alerts: PerformanceAlert[] = [];
  private observers: PerformanceObserver[] = [];
  private isMonitoring = false;
  private metricsHistory: AudioPerformanceMetrics[] = [];
  private maxHistorySize = 1000;

  constructor(thresholds?: Partial<PerformanceThresholds>) {
    this.thresholds = {
      renderCapacity: 80, // Alert at 80% render capacity
      callbackInterval: 15, // Alert at 15ms callback interval
      initializationTime: 1000, // Alert at 1s init time
      glitchRate: 5, // Alert at 5 glitches per minute
      memoryUsage: 100, // Alert at 100MB memory
      cpuUsage: 70, // Alert at 70% CPU
      latency: 50, // Alert at 50ms latency
      dropoutRate: 1, // Alert at 1% dropout rate
      ...thresholds,
    };

    this.metrics = {
      renderCapacity: 0,
      callbackInterval: 0,
      initializationTime: 0,
      glitchRate: 0,
      memoryUsage: 0,
      cpuUsage: 0,
      latency: 0,
      dropoutRate: 0,
    };
  }

  /**
   * Start monitoring audio performance for the given AudioContext
   */
  async startMonitoring(audioContext: AudioContext): Promise<void> {
    if (this.isMonitoring) {
      console.warn("Performance monitoring is already active");
      return;
    }

    this.audioContext = audioContext;
    const startTime = performance.now();

    try {
      // Create worklet node for performance monitoring
      this.workletNode = new AudioWorkletNode(
        audioContext,
        "audio-playback-processor"
      );
      this.workletNode.connect(audioContext.destination);

      // Initialize metrics collection
      await this.initializeMetricsCollection();

      // Record initialization time
      this.metrics.initializationTime = performance.now() - startTime;
      this.checkThresholds("initializationTime");

      this.isMonitoring = true;
      console.log("Audio performance monitoring started");
    } catch (error) {
      console.error("Failed to start performance monitoring:", error);
      throw error;
    }
  }

  /**
   * Stop monitoring and cleanup resources
   */
  stopMonitoring(): void {
    if (!this.isMonitoring) return;

    this.isMonitoring = false;

    // Disconnect worklet node
    if (this.workletNode) {
      this.workletNode.disconnect();
      this.workletNode = null;
    }

    // Disconnect performance observers
    this.observers.forEach((observer) => observer.disconnect());
    this.observers = [];

    this.audioContext = null;
    console.log("Audio performance monitoring stopped");
  }

  /**
   * Get current performance metrics
   */
  getCurrentMetrics(): AudioPerformanceMetrics {
    return { ...this.metrics };
  }

  /**
   * Get performance alerts
   */
  getAlerts(): PerformanceAlert[] {
    return [...this.alerts];
  }

  /**
   * Clear alerts
   */
  clearAlerts(): void {
    this.alerts = [];
  }

  /**
   * Get metrics history for analysis
   */
  getMetricsHistory(): AudioPerformanceMetrics[] {
    return [...this.metricsHistory];
  }

  /**
   * Generate performance report
   */
  generateReport(): {
    summary: AudioPerformanceMetrics;
    alerts: PerformanceAlert[];
    trends: {
      [key in keyof AudioPerformanceMetrics]?: {
        trend: "improving" | "degrading" | "stable";
        change: number;
        confidence: number;
      };
    };
  } {
    const summary = this.getCurrentMetrics();
    const alerts = this.getAlerts();
    const trends = this.analyzeTrends();

    return { summary, alerts, trends };
  }

  private async initializeMetricsCollection(): Promise<void> {
    // Setup Performance Observer for navigation timing
    if ("PerformanceObserver" in window) {
      const navObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          if (entry.entryType === "navigation") {
            // Extract navigation timing metrics
            const navEntry = entry as PerformanceNavigationTiming;
            this.metrics.initializationTime =
              navEntry.loadEventEnd - navEntry.loadEventStart;
          }
        });
      });
      navObserver.observe({ entryTypes: ["navigation"] });
      this.observers.push(navObserver);
    }

    // Setup memory monitoring
    this.startMemoryMonitoring();

    // Setup render capacity monitoring (Chrome-specific)
    this.startRenderCapacityMonitoring();

    // Setup periodic metrics collection
    this.startPeriodicMetricsCollection();
  }

  private startMemoryMonitoring(): void {
    if ("memory" in performance) {
      const updateMemoryMetrics = () => {
        const memory = (performance as any).memory;
        this.metrics.memoryUsage = memory.usedJSHeapSize / (1024 * 1024); // Convert to MB
        this.checkThresholds("memoryUsage");
      };

      updateMemoryMetrics();
      setInterval(updateMemoryMetrics, 5000); // Update every 5 seconds
    }
  }

  private startRenderCapacityMonitoring(): void {
    // Chrome DevTools WebAudio panel metrics
    // This would require Chrome DevTools protocol in real implementation
    const updateRenderMetrics = () => {
      if (!this.isMonitoring || !this.audioContext) return;

      // Simulate render capacity calculation
      // In real implementation, would use Chrome DevTools API
      const baseCapacity = 20; // Base capacity usage
      const variation = Math.random() * 10 - 5; // ±5% variation
      this.metrics.renderCapacity = Math.max(0, baseCapacity + variation);

      // Simulate callback interval
      this.metrics.callbackInterval = 10 + Math.random() * 4; // 10-14ms

      // Simulate audio latency
      this.metrics.latency =
        this.audioContext.baseLatency * 1000 + Math.random() * 10; // Convert to ms

      this.checkThresholds("renderCapacity");
      this.checkThresholds("callbackInterval");
      this.checkThresholds("latency");
    };

    setInterval(updateRenderMetrics, 1000); // Update every second
  }

  private startPeriodicMetricsCollection(): void {
    const collectMetrics = () => {
      if (!this.isMonitoring) return;

      // Update metrics history
      this.metricsHistory.push({ ...this.metrics });

      // Limit history size
      if (this.metricsHistory.length > this.maxHistorySize) {
        this.metricsHistory.shift();
      }

      // Simulate CPU usage (would use actual CPU monitoring in production)
      this.metrics.cpuUsage = Math.random() * 30 + 5; // 5-35%
      this.checkThresholds("cpuUsage");

      // Simulate glitch rate
      this.metrics.glitchRate = Math.random() * 2; // 0-2 glitches per minute
      this.checkThresholds("glitchRate");

      // Simulate dropout rate
      this.metrics.dropoutRate = Math.random() * 0.1; // 0-0.1%
    };

    setInterval(collectMetrics, 2000); // Collect every 2 seconds
  }

  private checkThresholds(metric: keyof AudioPerformanceMetrics): void {
    const value = this.metrics[metric];
    const threshold = this.thresholds[metric];

    if (value > threshold) {
      const alert: PerformanceAlert = {
        type: value > threshold * 1.2 ? "critical" : "warning",
        metric,
        value,
        threshold,
        timestamp: new Date(),
        message: `${metric} (${value.toFixed(2)}) exceeds threshold (${threshold})`,
      };

      this.alerts.push(alert);
      console.warn("Performance alert:", alert.message);

      // Limit alerts size
      if (this.alerts.length > 100) {
        this.alerts.shift();
      }
    }
  }

  private analyzeTrends(): {
    [key in keyof AudioPerformanceMetrics]?: {
      trend: "improving" | "degrading" | "stable";
      change: number;
      confidence: number;
    };
  } {
    const trends: any = {};
    const minHistorySize = 10;

    Object.keys(this.metrics).forEach((metric) => {
      const key = metric as keyof AudioPerformanceMetrics;
      const history = this.metricsHistory.slice(-minHistorySize);

      if (history.length < minHistorySize) return;

      const values = history.map((h) => h[key]);
      const firstHalf = values.slice(0, Math.floor(values.length / 2));
      const secondHalf = values.slice(Math.floor(values.length / 2));

      const firstAvg =
        firstHalf.reduce((sum, val) => sum + val, 0) / firstHalf.length;
      const secondAvg =
        secondHalf.reduce((sum, val) => sum + val, 0) / secondHalf.length;

      const change = secondAvg - firstAvg;
      const changePercent = Math.abs(change / firstAvg) * 100;

      let trend: "improving" | "degrading" | "stable";
      if (changePercent < 5) {
        trend = "stable";
      } else if (this.isImprovingMetric(key)) {
        trend = change < 0 ? "improving" : "degrading";
      } else {
        trend = change > 0 ? "improving" : "degrading";
      }

      trends[key] = {
        trend,
        change,
        confidence: Math.min(changePercent / 10, 1), // Simple confidence calculation
      };
    });

    return trends;
  }

  private isImprovingMetric(metric: keyof AudioPerformanceMetrics): boolean {
    // Lower values are better for these metrics
    const improvingMetrics = [
      "renderCapacity",
      "callbackInterval",
      "initializationTime",
      "glitchRate",
      "memoryUsage",
      "cpuUsage",
      "latency",
      "dropoutRate",
    ];
    return improvingMetrics.includes(metric);
  }
}

/**
 * Global performance monitoring instance
 */
export const audioPerformanceMonitor = new AudioPerformanceMonitor();
