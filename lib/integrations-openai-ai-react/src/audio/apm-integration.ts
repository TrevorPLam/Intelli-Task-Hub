/**
 * DataDog APM Integration for AudioWorklet Performance Monitoring
 * Implements real-time metrics collection and alerting for enterprise environments
 */

export interface DataDogMetric {
  name: string;
  value: number;
  tags: string[];
  timestamp?: Date;
  type: "gauge" | "count" | "rate" | "distribution";
  host?: string;
}

export interface DataDogAlert {
  title: string;
  text: string;
  tags: string[];
  alert_type: "error" | "warning" | "info" | "success";
  timestamp?: Date;
  aggregation_key?: string;
}

export interface DataDogConfiguration {
  apiKey: string;
  site: string;
  service: string;
  env: string;
  version?: string;
  enableCustomMetrics?: boolean;
  enableCustomActions?: boolean;
  forwardErrorsToLogs?: boolean;
  sessionSampleRate?: number;
}

export class DataDogAudioWorkletMonitor {
  private config: DataDogConfiguration;
  private isInitialized = false;
  private metricsBuffer: DataDogMetric[] = [];
  private alertBuffer: DataDogAlert[] = [];
  private maxBufferSize = 1000;

  constructor(config: DataDogConfiguration) {
    this.config = {
      apiKey: config.apiKey || "",
      site: config.site || "localhost",
      service: config.service || "audio-worklet",
      env: config.env || "development",
      version: config.version || "1.0.0",
      enableCustomMetrics: true,
      enableCustomActions: true,
      forwardErrorsToLogs: true,
      sessionSampleRate: 60, // 1 minute samples
    };
  }

  /**
   * Initialize DataDog monitoring
   */
  async initialize(): Promise<void> {
    if (this.isInitialized || !this.config.apiKey) {
      console.warn("DataDog monitoring not initialized: missing API key");
      return;
    }

    try {
      // Load DataDog browser SDK
      const { datadogRum } =
        await import("https://www.datadoghq.com/browser-sdk/v1/datadog-rum.js");

      // Initialize RUM monitoring
      datadogRum.init({
        clientToken: this.config.apiKey,
        site: this.config.site,
        service: this.config.service,
        env: this.config.env,
        version: this.config.version,
        trackInteractions: true,
        trackResources: true,
        enableExperimentalFeatures: ["feature-flags"],
        forwardErrorsToLogs: this.config.forwardErrorsToLogs,
        sessionSampleRate: this.config.sessionSampleRate,
      });

      // Setup custom metrics for AudioWorklet
      datadogRum.addAction("audio_worklet_render_capacity", {
        type: "gauge",
        name: "AudioWorklet Render Capacity",
        value: 0,
        tags: ["audio", "worklet", "performance"],
      });

      datadogRum.addAction("audio_worklet_callback_interval", {
        type: "gauge",
        name: "AudioWorklet Callback Interval",
        value: 0,
        tags: ["audio", "worklet", "timing"],
      });

      datadogRum.addAction("audio_worklet_initialization_time", {
        type: "gauge",
        name: "AudioWorklet Initialization Time",
        value: 0,
        tags: ["audio", "worklet", "performance"],
      });

      datadogRum.addAction("audio_worklet_memory_usage", {
        type: "gauge",
        name: "AudioWorklet Memory Usage",
        value: 0,
        tags: ["audio", "worklet", "memory"],
      });

      datadogRum.addAction("audio_worklet_glitch_rate", {
        type: "gauge",
        name: "AudioWorklet Glitch Rate",
        value: 0,
        tags: ["audio", "worklet", "performance"],
      });

      datadogRum.addAction("audio_worklet_cpu_usage", {
        type: "gauge",
        name: "AudioWorklet CPU Usage",
        value: 0,
        tags: ["audio", "worklet", "performance"],
      });

      this.isInitialized = true;
      console.log(
        "DataDog APM integration initialized for AudioWorklet monitoring"
      );
    } catch (error) {
      console.error("Failed to initialize DataDog monitoring:", error);
      throw error;
    }
  }

  /**
   * Record performance metrics
   */
  recordRenderCapacity(capacity: number): void {
    this.addMetric({
      name: "AudioWorklet Render Capacity",
      value: capacity,
      type: "gauge",
      tags: ["audio", "worklet", "performance"],
    });
  }

  recordCallbackInterval(interval: number): void {
    this.addMetric({
      name: "AudioWorklet Callback Interval",
      value: interval,
      type: "gauge",
      tags: ["audio", "worklet", "timing"],
    });
  }

  recordInitializationTime(time: number): void {
    this.addMetric({
      name: "AudioWorklet Initialization Time",
      value: time,
      type: "gauge",
      tags: ["audio", "worklet", "performance"],
    });
  }

  recordMemoryUsage(usage: number): void {
    this.addMetric({
      name: "AudioWorklet Memory Usage",
      value: usage,
      type: "gauge",
      tags: ["audio", "worklet", "memory"],
    });
  }

  recordGlitchRate(rate: number): void {
    this.addMetric({
      name: "AudioWorklet Glitch Rate",
      value: rate,
      type: "gauge",
      tags: ["audio", "worklet", "performance"],
    });
  }

  recordCpuUsage(usage: number): void {
    this.addMetric({
      name: "AudioWorklet CPU Usage",
      value: usage,
      type: "gauge",
      tags: ["audio", "worklet", "performance"],
    });
  }

  recordAudioProcessed(samples: number): void {
    this.addMetric({
      name: "AudioWorklet Samples Processed",
      value: samples,
      type: "count",
      tags: ["audio", "worklet", "performance"],
    });
  }

  recordError(error: Error, context?: string): void {
    this.addAlert({
      title: "AudioWorklet Error",
      text: error.message,
      alert_type: "error",
      tags: ["audio", "worklet", "error"],
      context,
    });
  }

  recordWarning(message: string, context?: string): void {
    this.addAlert({
      title: "AudioWorklet Warning",
      text: message,
      alert_type: "warning",
      tags: ["audio", "worklet", "warning"],
      context,
    });
  }

  recordInfo(message: string, context?: string): void {
    this.addAlert({
      title: "AudioWorklet Info",
      text: message,
      alert_type: "info",
      tags: ["audio", "worklet", "info"],
      context,
    });
  }

  recordSuccess(message: string, context?: string): void {
    this.addAlert({
      title: "AudioWorklet Success",
      text: message,
      alert_type: "success",
      tags: ["audio", "worklet", "success"],
      context,
    });
  }

  /**
   * Add metric to buffer and send if needed
   */
  private async addMetric(metric: DataDogMetric): Promise<void> {
    this.metricsBuffer.push(metric);

    if (this.metricsBuffer.length >= this.maxBufferSize) {
      await this.flushMetrics();
    }

    if (this.isInitialized) {
      // Send to DataDog
      const { datadogRum } =
        await import("https://www.datadoghq.com/browser-sdk/v1/datadog-rum.js");
      datadogRum.addAction(metric.name, metric);
    }
  }

  /**
   * Add alert to buffer and send if needed
   */
  private async addAlert(alert: DataDogAlert): Promise<void> {
    this.alertBuffer.push(alert);

    if (this.alertBuffer.length >= this.maxBufferSize) {
      await this.flushAlerts();
    }

    if (this.isInitialized) {
      // Send to DataDog
      const { datadogRum } =
        await import("https://www.datadoghq.com/browser-sdk/v1/datadog-rum.js");
      datadogRum.addAlert(alert);
    }
  }

  /**
   * Flush metrics to DataDog
   */
  private async flushMetrics(): Promise<void> {
    if (!this.isInitialized || this.metricsBuffer.length === 0) return;

    const { datadogRum } =
      await import("https://www.datadoghq.com/browser-sdk/v1/datadog-rum.js");

    for (const metric of this.metricsBuffer) {
      datadogRum.addAction(metric.name, metric);
    }

    console.log(`Flushed ${this.metricsBuffer.length} metrics to DataDog`);
    this.metricsBuffer = [];
  }

  /**
   * Flush alerts to DataDog
   */
  private async flushAlerts(): Promise<void> {
    if (!this.isInitialized || this.alertBuffer.length === 0) return;

    const { datadogRum } =
      await import("https://www.datadoghq.com/browser-sdk/v1/datadog-rum.js");

    for (const alert of this.alertBuffer) {
      datadogRum.addAlert(alert);
    }

    console.log(`Flushed ${this.alertBuffer.length} alerts to DataDog`);
    this.alertBuffer = [];
  }

  /**
   * Get current metrics and alerts
   */
  getMetrics(): DataDogMetric[] {
    return [...this.metricsBuffer];
  }

  getAlerts(): DataDogAlert[] {
    return [...this.alertBuffer];
  }

  /**
   * Cleanup resources
   */
  dispose(): void {
    this.flushMetrics();
    this.flushAlerts();
    this.isInitialized = false;
    this.metricsBuffer = [];
    this.alertBuffer = [];

    console.log("DataDog APM integration disposed");
  }
}

/**
 * Universal APM integration that supports multiple providers
 */
export class UniversalAPMIntegration {
  private provider: "datadog" | "newrelic" | "sentry";
  private datadogMonitor: DataDogAudioWorkletMonitor | null = null;
  private newrelicMonitor: any = null;
  private sentryMonitor: any = null;

  constructor(provider: "datadog" | "newrelic" | "sentry", config?: any) {
    this.provider = provider;

    switch (provider) {
      case "datadog":
        this.datadogMonitor = new DataDogAudioWorkletMonitor(config);
        break;
      case "newrelic":
        // New Relic integration would go here
        break;
      case "sentry":
        // Sentry integration would go here
        break;
      default:
        throw new Error(`Unsupported APM provider: ${provider}`);
    }
  }

  async initialize(): Promise<void> {
    switch (this.provider) {
      case "datadog":
        await this.datadogMonitor!.initialize();
        break;
      case "newrelic":
        // Initialize New Relic
        break;
      case "sentry":
        // Initialize Sentry
        break;
      default:
        throw new Error(`APM provider not initialized`);
    }
  }

  recordRenderCapacity(capacity: number): void {
    switch (this.provider) {
      case "datadog":
        this.datadogMonitor?.recordRenderCapacity(capacity);
        break;
      case "newrelic":
        // New Relic integration
        break;
      case "sentry":
        // Sentry integration
        break;
    }
  }

  recordError(error: Error, context?: string): void {
    switch (this.provider) {
      case "datadog":
        this.datadogMonitor?.recordError(error, context);
        break;
      case "newrelic":
        // New Relic integration
        break;
      case "sentry":
        // Sentry integration
        break;
    }
  }

  recordWarning(message: string, context?: string): void {
    switch (this.provider) {
      case "datadog":
        this.datadogMonitor?.recordWarning(message, context);
        break;
      case "newrelic":
        // New Relic integration
        break;
      case "sentry":
        // Sentry integration
        break;
    }
  }

  recordInfo(message: string, context?: string): void {
    switch (this.provider) {
      case "datadog":
        this.datadogMonitor?.recordInfo(message, context);
        break;
      case "newrelic":
        // New Relic integration
        break;
      case "sentry":
        // Sentry integration
        break;
    }
  }

  dispose(): void {
    switch (this.provider) {
      case "datadog":
        this.datadogMonitor?.dispose();
        break;
      case "newrelic":
        // New Relic integration
        break;
      case "sentry":
        // Sentry integration
        break;
    }
  }
}

// Export the universal APM integration
export { UniversalAPMIntegration, DataDogAudioWorkletMonitor };
