/**
 * @fileoverview Unit tests for ErrorAggregator
 *
 * Tests error tracking, deduplication, statistics, alerting, and cleanup.
 *
 * @module @workspace/api-server/__tests__/error-aggregator.test
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  ErrorAggregator,
  trackError,
  getErrorStatistics,
  type ErrorContext,
} from "../lib/error-aggregator";

describe("ErrorAggregator", () => {
  let aggregator: ErrorAggregator;

  beforeEach(() => {
    ErrorAggregator.resetInstance();
    aggregator = ErrorAggregator.getInstance();
  });

  afterEach(() => {
    ErrorAggregator.resetInstance();
  });

  describe("trackError", () => {
    it("should track a new error", () => {
      const context: ErrorContext = {
        correlationId: "test-123",
        method: "GET",
        path: "/api/test",
      };

      const error = aggregator.trackError({
        severity: "high",
        type: "TEST_ERROR",
        message: "Test error message",
        context,
      });

      expect(error).toBeDefined();
      expect(error.type).toBe("TEST_ERROR");
      expect(error.severity).toBe("high");
      expect(error.message).toBe("Test error message");
      expect(error.context.correlationId).toBe("test-123");
      expect(error.occurrenceCount).toBe(1);
      expect(error.id).toBeDefined();
    });

    it("should deduplicate identical errors", () => {
      const context: ErrorContext = {
        correlationId: "test-123",
        method: "GET",
        path: "/api/test",
      };

      const error1 = aggregator.trackError({
        severity: "high",
        type: "TEST_ERROR",
        message: "Same message",
        context,
      });

      const error2 = aggregator.trackError({
        severity: "high",
        type: "TEST_ERROR",
        message: "Same message",
        context,
      });

      expect(error1.id).toBe(error2.id);
      expect(error2.occurrenceCount).toBe(2);
    });

    it("should upgrade severity when same error becomes more severe", () => {
      const context: ErrorContext = {
        correlationId: "test-123",
        method: "GET",
        path: "/api/test",
      };

      aggregator.trackError({
        severity: "low",
        type: "TEST_ERROR",
        message: "Same message",
        context,
      });

      const upgraded = aggregator.trackError({
        severity: "critical",
        type: "TEST_ERROR",
        message: "Same message",
        context,
      });

      expect(upgraded.severity).toBe("critical");
    });

    it("should track different error types separately", () => {
      const context: ErrorContext = {
        correlationId: "test-123",
        method: "GET",
        path: "/api/test",
      };

      const error1 = aggregator.trackError({
        severity: "high",
        type: "ERROR_TYPE_A",
        message: "Message A",
        context,
      });

      const error2 = aggregator.trackError({
        severity: "high",
        type: "ERROR_TYPE_B",
        message: "Message B",
        context,
      });

      expect(error1.id).not.toBe(error2.id);
    });
  });

  describe("getErrors", () => {
    beforeEach(() => {
      aggregator.trackError({
        severity: "high",
        type: "HIGH_ERROR",
        message: "High severity",
        context: { correlationId: "1", method: "GET", path: "/" },
      });

      aggregator.trackError({
        severity: "low",
        type: "LOW_ERROR",
        message: "Low severity",
        context: { correlationId: "2", method: "GET", path: "/" },
      });
    });

    it("should filter by severity", () => {
      const highErrors = aggregator.getErrors({ severity: "high" });
      expect(highErrors).toHaveLength(1);
      expect(highErrors[0].type).toBe("HIGH_ERROR");
    });

    it("should filter by type", () => {
      const typeErrors = aggregator.getErrors({ type: "LOW_ERROR" });
      expect(typeErrors).toHaveLength(1);
      expect(typeErrors[0].severity).toBe("low");
    });

    it("should limit results", () => {
      const limited = aggregator.getErrors({ limit: 1 });
      expect(limited).toHaveLength(1);
    });

    it("should sort by timestamp descending", () => {
      const errors = aggregator.getErrors();
      expect(errors[0].timestamp >= errors[1].timestamp).toBe(true);
    });
  });

  describe("getStatistics", () => {
    it("should calculate statistics correctly", () => {
      // Add various errors
      aggregator.trackError({
        severity: "high",
        type: "ERROR_A",
        message: "Message 1",
        context: { correlationId: "1", method: "GET", path: "/" },
      });

      aggregator.trackError({
        severity: "high",
        type: "ERROR_A",
        message: "Message 1", // Duplicate
        context: { correlationId: "2", method: "GET", path: "/" },
      });

      aggregator.trackError({
        severity: "low",
        type: "ERROR_B",
        message: "Message 2",
        context: { correlationId: "3", method: "GET", path: "/" },
      });

      const stats = aggregator.getStatistics();

      expect(stats.totalErrors).toBe(3);
      expect(stats.bySeverity.high).toBe(2);
      expect(stats.bySeverity.low).toBe(1);
      expect(stats.byType["ERROR_A"]).toBe(2);
      expect(stats.byType["ERROR_B"]).toBe(1);
      expect(stats.uniqueTypes).toBe(2);
    });
  });

  describe("alerting", () => {
    it("should trigger alert when threshold is exceeded", () => {
      const alertCallback = vi.fn();

      const testAggregator = ErrorAggregator.getInstance({
        alerts: [
          {
            threshold: 3,
            windowMinutes: 5,
            minSeverity: "medium",
            onAlert: alertCallback,
            cooldownMinutes: 0, // No cooldown for testing
          },
        ],
      });

      // Track 3 errors to exceed threshold
      for (let i = 0; i < 3; i++) {
        testAggregator.trackError({
          severity: "high",
          type: "ALERT_TEST",
          message: `Error ${i}`,
          context: { correlationId: `alert-${i}`, method: "GET", path: "/" },
        });
      }

      expect(alertCallback).toHaveBeenCalledTimes(1);
      const alertArg = alertCallback.mock.calls[0][0];
      expect(alertArg.type).toBe("threshold_exceeded");
      expect(alertArg.errorCount).toBeGreaterThanOrEqual(3);
      expect(alertArg.severity).toBe("medium");
    });

    it("should respect cooldown period", () => {
      const alertCallback = vi.fn();

      const testAggregator = ErrorAggregator.getInstance({
        alerts: [
          {
            threshold: 1,
            windowMinutes: 5,
            minSeverity: "low",
            onAlert: alertCallback,
            cooldownMinutes: 60, // Long cooldown
          },
        ],
      });

      // First error - should trigger
      testAggregator.trackError({
        severity: "high",
        type: "COOLDOWN_TEST",
        message: "Error 1",
        context: { correlationId: "1", method: "GET", path: "/" },
      });

      expect(alertCallback).toHaveBeenCalledTimes(1);

      // Second error - should NOT trigger due to cooldown
      testAggregator.trackError({
        severity: "high",
        type: "COOLDOWN_TEST",
        message: "Error 2",
        context: { correlationId: "2", method: "GET", path: "/" },
      });

      expect(alertCallback).toHaveBeenCalledTimes(1); // Still 1
    });

    it("should not alert for errors below minimum severity", () => {
      const alertCallback = vi.fn();

      const testAggregator = ErrorAggregator.getInstance({
        alerts: [
          {
            threshold: 1,
            windowMinutes: 5,
            minSeverity: "high",
            onAlert: alertCallback,
          },
        ],
      });

      // Low severity error should not trigger
      testAggregator.trackError({
        severity: "low",
        type: "SEVERITY_TEST",
        message: "Low severity",
        context: { correlationId: "1", method: "GET", path: "/" },
      });

      expect(alertCallback).not.toHaveBeenCalled();
    });
  });

  describe("cleanup", () => {
    it("should clear all errors", () => {
      aggregator.trackError({
        severity: "high",
        type: "TEST",
        message: "Message",
        context: { correlationId: "1", method: "GET", path: "/" },
      });

      expect(aggregator.getErrors()).toHaveLength(1);

      aggregator.clear();

      expect(aggregator.getErrors()).toHaveLength(0);
    });

    it("should enforce max error limit", () => {
      const smallAggregator = ErrorAggregator.getInstance({
        maxErrors: 2,
        autoCleanup: false,
      });

      // Add 3 errors exceeding limit
      for (let i = 0; i < 3; i++) {
        smallAggregator.trackError({
          severity: "high",
          type: "LIMIT_TEST",
          message: `Message ${i}`,
          context: { correlationId: `${i}`, method: "GET", path: "/" },
        });
      }

      // Should only keep 2 (most recent)
      const errors = smallAggregator.getErrors();
      expect(errors.length).toBeLessThanOrEqual(2);
    });
  });

  describe("convenience functions", () => {
    it("trackError should use singleton", () => {
      const error = trackError({
        severity: "medium",
        type: "CONVENIENCE_TEST",
        message: "Test",
        context: { correlationId: "conv-1", method: "GET", path: "/" },
      });

      expect(error).toBeDefined();
      expect(error.type).toBe("CONVENIENCE_TEST");

      const stats = getErrorStatistics();
      expect(stats.totalErrors).toBeGreaterThanOrEqual(1);
    });
  });
});
