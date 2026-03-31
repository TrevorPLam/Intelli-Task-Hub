/**
 * @fileoverview Error aggregation service for centralized error tracking and alerting.
 *
 * Collects, stores, and analyzes errors across the API server for monitoring,
 * alerting, and debugging purposes. Implements in-memory storage with
 * configurable retention and automatic cleanup.
 *
 * @module @workspace/api-server/lib/error-aggregator
 * @version 1.0.0
 * @since 2026-03-30
 */

import { logger } from "./logger";

/**
 * Severity levels for error classification.
 */
export type ErrorSeverity = "low" | "medium" | "high" | "critical";

/**
 * Error context for debugging and correlation.
 */
export interface ErrorContext {
  /** Unique correlation ID for request tracing */
  correlationId: string;
  /** HTTP method if applicable */
  method?: string;
  /** Request URL path */
  path?: string;
  /** User agent string */
  userAgent?: string;
  /** Client IP address */
  ip?: string;
  /** Additional metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Aggregated error entry with tracking metadata.
 */
export interface AggregatedError {
  /** Unique error ID */
  id: string;
  /** Error classification */
  severity: ErrorSeverity;
  /** Error type/category */
  type: string;
  /** Error message */
  message: string;
  /** Stack trace if available */
  stack?: string;
  /** Error context */
  context: ErrorContext;
  /** Timestamp when error occurred */
  timestamp: Date;
  /** Number of occurrences (for deduplication) */
  occurrenceCount: number;
  /** Last occurrence timestamp */
  lastOccurrence: Date;
}

/**
 * Error alert configuration with rate limiting.
 */
export interface ErrorAlertConfig {
  /** Threshold for triggering alert (errors per minute) */
  threshold: number;
  /** Time window in minutes for threshold calculation */
  windowMinutes: number;
  /** Minimum severity to trigger alert */
  minSeverity: ErrorSeverity;
  /** Alert callback function */
  onAlert: (alert: ErrorAlert) => void;
  /** Cooldown period in minutes between alerts (default: 15) */
  cooldownMinutes?: number;
}

/**
 * Error alert notification.
 */
export interface ErrorAlert {
  /** Alert type */
  type: "threshold_exceeded" | "spike_detected" | "critical_error";
  /** Alert severity */
  severity: ErrorSeverity;
  /** Alert message */
  message: string;
  /** Error count triggering alert */
  errorCount: number;
  /** Time window for the alert */
  windowMinutes: number;
  /** Affected error types */
  affectedTypes: string[];
  /** Timestamp of alert */
  timestamp: Date;
}

/**
 * Configuration options for error aggregation.
 */
export interface ErrorAggregatorConfig {
  /** Maximum number of errors to retain in memory */
  maxErrors: number;
  /** Error retention time in milliseconds (default: 24 hours) */
  retentionMs: number;
  /** Enable automatic cleanup of old errors */
  autoCleanup: boolean;
  /** Cleanup interval in milliseconds (default: 5 minutes) */
  cleanupIntervalMs: number;
  /** Alert configurations */
  alerts?: ErrorAlertConfig[];
}

/**
 * Error statistics summary.
 */
export interface ErrorStatistics {
  /** Total errors tracked */
  totalErrors: number;
  /** Errors by severity */
  bySeverity: Record<ErrorSeverity, number>;
  /** Errors by type */
  byType: Record<string, number>;
  /** Errors in last hour */
  lastHour: number;
  /** Errors in last 24 hours */
  last24Hours: number;
  /** Unique error types */
  uniqueTypes: number;
  /** Top error types */
  topTypes: Array<{ type: string; count: number }>;
}

/**
 * Default configuration values.
 */
const DEFAULT_CONFIG: ErrorAggregatorConfig = {
  maxErrors: 10000,
  retentionMs: 24 * 60 * 60 * 1000, // 24 hours
  autoCleanup: true,
  cleanupIntervalMs: 5 * 60 * 1000, // 5 minutes
};

/**
 * Severity ranking for comparison.
 */
const SEVERITY_RANK: Record<ErrorSeverity, number> = {
  low: 1,
  medium: 2,
  high: 3,
  critical: 4,
};

/**
 * Error aggregation service for centralized error tracking.
 *
 * Implements the Singleton pattern to ensure single instance across the
 * application. Provides error deduplication, statistics, and alerting.
 *
 * @example
 * ```typescript
 * const aggregator = ErrorAggregator.getInstance();
 *
 * // Track an error
 * aggregator.trackError({
 *   severity: "high",
 *   type: "DATABASE_ERROR",
 *   message: "Connection failed",
 *   context: { correlationId: "abc-123", path: "/api/users" }
 * });
 *
 * // Get statistics
 * const stats = aggregator.getStatistics();
 * console.log(`Total errors: ${stats.totalErrors}`);
 * ```
 */
export class ErrorAggregator {
  private static instance: ErrorAggregator | null = null;
  private errors: Map<string, AggregatedError> = new Map();
  private config: ErrorAggregatorConfig;
  private cleanupTimer: NodeJS.Timeout | null = null;
  private lastAlertTimes: Map<string, Date> = new Map();

  /**
   * Private constructor to enforce singleton pattern.
   */
  private constructor(config: Partial<ErrorAggregatorConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };

    if (this.config.autoCleanup) {
      this.startCleanupTimer();
    }
  }

  /**
   * Gets the singleton instance of the error aggregator.
   *
   * @param config - Optional configuration (only applies on first call)
   * @returns The error aggregator instance
   */
  public static getInstance(
    config?: Partial<ErrorAggregatorConfig>
  ): ErrorAggregator {
    if (!ErrorAggregator.instance) {
      ErrorAggregator.instance = new ErrorAggregator(config);
    }
    return ErrorAggregator.instance;
  }

  /**
   * Resets the singleton instance (useful for testing).
   */
  public static resetInstance(): void {
    if (ErrorAggregator.instance) {
      ErrorAggregator.instance.destroy();
      ErrorAggregator.instance = null;
    }
  }

  /**
   * Tracks an error for aggregation and monitoring.
   *
   * @param error - Error details to track
   * @returns The aggregated error entry (new or updated)
   */
  public trackError(error: {
    severity: ErrorSeverity;
    type: string;
    message: string;
    stack?: string;
    context: ErrorContext;
  }): AggregatedError {
    // Generate deduplication key based on error type and message hash
    const dedupKey = this.generateDedupKey(error.type, error.message);
    const now = new Date();

    const existing = this.errors.get(dedupKey);

    if (existing) {
      // Update existing error entry
      existing.occurrenceCount++;
      existing.lastOccurrence = now;

      // Upgrade severity if new error is more severe
      if (SEVERITY_RANK[error.severity] > SEVERITY_RANK[existing.severity]) {
        existing.severity = error.severity;
      }

      // Update context with latest
      existing.context = error.context;

      this.checkAlerts(existing);

      logger.debug(
        {
          errorId: existing.id,
          type: existing.type,
          occurrenceCount: existing.occurrenceCount,
        },
        "Error occurrence incremented"
      );

      return existing;
    }

    // Create new error entry
    const newError: AggregatedError = {
      id: crypto.randomUUID(),
      severity: error.severity,
      type: error.type,
      message: error.message,
      stack: error.stack,
      context: error.context,
      timestamp: now,
      occurrenceCount: 1,
      lastOccurrence: now,
    };

    // Enforce max errors limit
    if (this.errors.size >= this.config.maxErrors) {
      this.removeOldestError();
    }

    this.errors.set(dedupKey, newError);

    // Log based on severity
    this.logError(newError);

    // Check alert conditions
    this.checkAlerts(newError);

    return newError;
  }

  /**
   * Gets all tracked errors with optional filtering.
   *
   * @param options - Filter options
   * @returns Filtered array of errors
   */
  public getErrors(
    options: {
      severity?: ErrorSeverity;
      type?: string;
      since?: Date;
      limit?: number;
    } = {}
  ): AggregatedError[] {
    let results = Array.from(this.errors.values());

    if (options.severity) {
      results = results.filter((e) => e.severity === options.severity);
    }

    if (options.type) {
      results = results.filter((e) => e.type === options.type);
    }

    if (options.since) {
      results = results.filter((e) => e.timestamp >= options.since!);
    }

    // Sort by timestamp descending (newest first)
    results.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    if (options.limit) {
      results = results.slice(0, options.limit);
    }

    return results;
  }

  /**
   * Gets error statistics summary.
   *
   * @returns Error statistics
   */
  public getStatistics(): ErrorStatistics {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const errors = Array.from(this.errors.values());

    // Calculate severity counts
    const bySeverity: Record<ErrorSeverity, number> = {
      low: 0,
      medium: 0,
      high: 0,
      critical: 0,
    };

    // Calculate type counts
    const byType: Record<string, number> = {};

    let lastHour = 0;
    let last24Hours = 0;

    for (const error of errors) {
      bySeverity[error.severity] += error.occurrenceCount;

      byType[error.type] = (byType[error.type] || 0) + error.occurrenceCount;

      if (error.lastOccurrence >= oneHourAgo) {
        lastHour += error.occurrenceCount;
      }

      if (error.lastOccurrence >= oneDayAgo) {
        last24Hours += error.occurrenceCount;
      }
    }

    // Get top error types
    const topTypes = Object.entries(byType)
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      totalErrors: errors.reduce((sum, e) => sum + e.occurrenceCount, 0),
      bySeverity,
      byType,
      lastHour,
      last24Hours,
      uniqueTypes: Object.keys(byType).length,
      topTypes,
    };
  }

  /**
   * Clears all tracked errors.
   */
  public clear(): void {
    const count = this.errors.size;
    this.errors.clear();
    logger.info({ clearedCount: count }, "Error aggregator cleared");
  }

  /**
   * Destroys the aggregator and cleans up resources.
   */
  public destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
    this.errors.clear();
    logger.info("Error aggregator destroyed");
  }

  /**
   * Generates a deduplication key for error grouping.
   */
  private generateDedupKey(type: string, message: string): string {
    // Simple hash for deduplication
    const str = `${type}:${message}`;
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return `${type}:${hash}`;
  }

  /**
   * Removes the oldest error to make room for new ones.
   */
  private removeOldestError(): void {
    let oldest: AggregatedError | null = null;
    let oldestKey: string | null = null;

    for (const [key, error] of this.errors.entries()) {
      if (!oldest || error.timestamp < oldest.timestamp) {
        oldest = error;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.errors.delete(oldestKey);
      logger.debug(
        { errorId: oldest!.id },
        "Removed oldest error to make room"
      );
    }
  }

  /**
   * Starts the automatic cleanup timer.
   */
  private startCleanupTimer(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanupOldErrors();
    }, this.config.cleanupIntervalMs);

    logger.debug(
      { intervalMs: this.config.cleanupIntervalMs },
      "Error aggregator cleanup timer started"
    );
  }

  /**
   * Removes errors older than the retention period.
   */
  private cleanupOldErrors(): void {
    const cutoff = new Date(Date.now() - this.config.retentionMs);
    let removed = 0;

    for (const [key, error] of this.errors.entries()) {
      if (error.lastOccurrence < cutoff) {
        this.errors.delete(key);
        removed++;
      }
    }

    if (removed > 0) {
      logger.debug({ removedCount: removed }, "Cleaned up old errors");
    }
  }

  /**
   * Logs error based on severity.
   */
  private logError(error: AggregatedError): void {
    const logData = {
      errorId: error.id,
      type: error.type,
      severity: error.severity,
      correlationId: error.context.correlationId,
      path: error.context.path,
      message: error.message,
    };

    switch (error.severity) {
      case "critical":
        logger.fatal(logData, "Critical error tracked");
        break;
      case "high":
        logger.error(logData, "High severity error tracked");
        break;
      case "medium":
        logger.warn(logData, "Medium severity error tracked");
        break;
      case "low":
        logger.info(logData, "Low severity error tracked");
        break;
    }
  }

  /**
   * Checks and triggers configured alerts with rate limiting.
   */
  private checkAlerts(error: AggregatedError): void {
    if (!this.config.alerts) return;

    const now = new Date();

    for (const alertConfig of this.config.alerts) {
      // Check minimum severity
      if (
        SEVERITY_RANK[error.severity] < SEVERITY_RANK[alertConfig.minSeverity]
      ) {
        continue;
      }

      // Check cooldown period
      const cooldownMs = (alertConfig.cooldownMinutes ?? 15) * 60 * 1000;
      const alertKey = `${alertConfig.minSeverity}-${alertConfig.windowMinutes}`;
      const lastAlert = this.lastAlertTimes.get(alertKey);

      if (lastAlert && now.getTime() - lastAlert.getTime() < cooldownMs) {
        // Still in cooldown period, skip alert
        continue;
      }

      // Count errors in the window
      const windowStart = new Date(
        now.getTime() - alertConfig.windowMinutes * 60 * 1000
      );
      const errorsInWindow = this.getErrors({ since: windowStart });
      const count = errorsInWindow.reduce(
        (sum, e) => sum + e.occurrenceCount,
        0
      );

      if (count >= alertConfig.threshold) {
        const affectedTypes = [...new Set(errorsInWindow.map((e) => e.type))];

        const alert: ErrorAlert = {
          type: "threshold_exceeded",
          severity: alertConfig.minSeverity,
          message: `Error threshold exceeded: ${count} errors in last ${alertConfig.windowMinutes} minutes`,
          errorCount: count,
          windowMinutes: alertConfig.windowMinutes,
          affectedTypes,
          timestamp: now,
        };

        // Record alert time for cooldown
        this.lastAlertTimes.set(alertKey, now);

        alertConfig.onAlert(alert);
      }
    }
  }
}

/**
 * Convenience function to track an error using the singleton instance.
 *
 * @param error - Error details to track
 * @returns The aggregated error entry
 */
export function trackError(error: {
  severity: ErrorSeverity;
  type: string;
  message: string;
  stack?: string;
  context: ErrorContext;
}): AggregatedError {
  return ErrorAggregator.getInstance().trackError(error);
}

/**
 * Convenience function to get error statistics.
 *
 * @returns Error statistics
 */
export function getErrorStatistics(): ErrorStatistics {
  return ErrorAggregator.getInstance().getStatistics();
}
