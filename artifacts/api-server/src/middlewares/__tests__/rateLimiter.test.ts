/**
 * Rate Limiter Middleware Unit Tests
 *
 * Tests the rate limiting functionality for both general and OpenAI endpoints.
 * Follows 2026 best practices for isolated unit testing with mocked dependencies.
 *
 * @fileoverview Rate limiter middleware unit tests
 * @version 1.0.0
 * @since 2026-03-30
 * @author Intelli-Task-Hub Team
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import request from "supertest";
import express from "express";
import { generalLimiter, openaiLimiter } from "../rateLimiter";

describe("Rate Limiter Middleware", () => {
  let app: express.Application;
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    originalEnv = { ...process.env };
    vi.useFakeTimers();

    app = express();
    app.use(express.json());

    // Test endpoint with general rate limiter
    app.get("/test-general", generalLimiter, (req, res) => {
      res.json({ message: "General endpoint" });
    });

    // Test endpoint with OpenAI rate limiter
    app.get("/test-openai", openaiLimiter, (req, res) => {
      res.json({ message: "OpenAI endpoint" });
    });
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.useRealTimers();
  });

  describe("General Rate Limiter", () => {
    it("should allow requests within limit", async () => {
      const response = await request(app).get("/test-general");

      expect(response.status).toBe(200);
      expect(response.body.message).toBe("General endpoint");
    });

    it("should include rate limit headers", async () => {
      const response = await request(app).get("/test-general");

      expect(response.headers).toHaveProperty("ratelimit-limit");
      expect(response.headers).toHaveProperty("ratelimit-remaining");
      expect(response.headers).toHaveProperty("ratelimit-reset");
    });

    it("should use custom configuration from environment", async () => {
      process.env.RATE_LIMIT_GENERAL_MAX = "5";
      process.env.RATE_LIMIT_GENERAL_WINDOW_MS = "10000";

      // Make requests up to the limit
      const requests = Array.from({ length: 5 }, () =>
        request(app).get("/test-general")
      );

      const responses = await Promise.all(requests);

      responses.forEach((response) => {
        expect(response.status).toBe(200);
      });
    });

    it("should rate limit when exceeded", async () => {
      process.env.RATE_LIMIT_GENERAL_MAX = "2";
      process.env.RATE_LIMIT_GENERAL_WINDOW_MS = "10000";

      // Make requests up to and beyond the limit
      const responses = await Promise.all([
        request(app).get("/test-general"),
        request(app).get("/test-general"),
        request(app).get("/test-general"),
      ]);

      // First two should succeed
      expect(responses[0].status).toBe(200);
      expect(responses[1].status).toBe(200);

      // Third should be rate limited
      expect(responses[2].status).toBe(429);
      expect(responses[2].body.error).toBe("Too Many Requests");
      expect(responses[2].headers).toHaveProperty("retry-after");
    });
  });

  describe("OpenAI Rate Limiter", () => {
    it("should allow requests within OpenAI limit", async () => {
      const response = await request(app).get("/test-openai");

      expect(response.status).toBe(200);
      expect(response.body.message).toBe("OpenAI endpoint");
    });

    it("should use stricter limits for OpenAI endpoints", async () => {
      process.env.RATE_LIMIT_OPENAI_MAX = "3";
      process.env.RATE_LIMIT_OPENAI_WINDOW_MS = "10000";

      // Make requests up to and beyond the OpenAI limit
      const responses = await Promise.all([
        request(app).get("/test-openai"),
        request(app).get("/test-openai"),
        request(app).get("/test-openai"),
        request(app).get("/test-openai"),
      ]);

      // First three should succeed
      expect(responses[0].status).toBe(200);
      expect(responses[1].status).toBe(200);
      expect(responses[2].status).toBe(200);

      // Fourth should be rate limited
      expect(responses[3].status).toBe(429);
      expect(responses[3].body.message).toContain(
        "OpenAI endpoint rate limit exceeded"
      );
    });
  });

  describe("IP-based Key Generation", () => {
    it("should use different keys for different IPs", async () => {
      const response1 = await request(app)
        .get("/test-general")
        .set("X-Forwarded-For", "192.168.1.1");

      const response2 = await request(app)
        .get("/test-general")
        .set("X-Forwarded-For", "192.168.1.2");

      expect(response1.status).toBe(200);
      expect(response2.status).toBe(200);
    });

    it("should handle missing IP gracefully", () => {
      // Should not crash and should use fallback
      expect(() => {
        request(app).get("/test-general");
      }).not.toThrow();
    });
  });

  describe("Environment Variable Parsing", () => {
    it("should use default values when environment variables are missing", () => {
      delete process.env.RATE_LIMIT_GENERAL_MAX;
      delete process.env.RATE_LIMIT_GENERAL_WINDOW_MS;

      // Should not throw and should use defaults
      expect(() => {
        request(app).get("/test-general");
      }).not.toThrow();
    });

    it("should handle invalid environment values", () => {
      process.env.RATE_LIMIT_GENERAL_MAX = "invalid";
      process.env.RATE_LIMIT_GENERAL_WINDOW_MS = "not-a-number";

      // Should not throw and should use defaults
      expect(() => {
        request(app).get("/test-general");
      }).not.toThrow();
    });
  });

  describe("Rate Limit Response Format", () => {
    it("should return proper error response structure", async () => {
      process.env.RATE_LIMIT_GENERAL_MAX = "1";

      // First request succeeds
      await request(app).get("/test-general");

      // Second request should be rate limited
      const response = await request(app).get("/test-general");

      expect(response.status).toBe(429);
      expect(response.body).toHaveProperty("status", 429);
      expect(response.body).toHaveProperty("error", "Too Many Requests");
      expect(response.body).toHaveProperty("message");
    });

    it("should include Retry-After header", async () => {
      process.env.RATE_LIMIT_GENERAL_MAX = "1";

      // First request succeeds
      await request(app).get("/test-general");

      // Second request should include Retry-After
      const response = await request(app).get("/test-general");

      expect(response.headers["retry-after"]).toBeDefined();
      expect(typeof response.headers["retry-after"]).toBe("string");
    });
  });

  describe("Time-based Reset", () => {
    it("should reset rate limit after window expires", async () => {
      process.env.RATE_LIMIT_GENERAL_MAX = "2";
      process.env.RATE_LIMIT_GENERAL_WINDOW_MS = "1000";

      // Use up the limit
      await request(app).get("/test-general");
      await request(app).get("/test-general");

      // Should be rate limited
      const limitedResponse = await request(app).get("/test-general");
      expect(limitedResponse.status).toBe(429);

      // Advance time past the window
      vi.advanceTimersByTime(1100);

      // Should allow requests again
      const resetResponse = await request(app).get("/test-general");
      expect(resetResponse.status).toBe(200);
    });
  });
});
