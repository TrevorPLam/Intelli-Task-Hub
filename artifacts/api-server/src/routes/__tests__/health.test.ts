/**
 * Health Route Unit Tests
 *
 * Tests health check endpoint functionality and response format.
 * Follows 2026 best practices for isolated unit testing.
 *
 * @fileoverview Health endpoint unit tests
 * @version 1.0.0
 * @since 2026-03-30
 * @author Intelli-Task-Hub Team
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import express from "express";
import healthRouter from "../health";

describe("Health Route", () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use("/", healthRouter);
  });

  describe("GET /healthz", () => {
    it("should return 200 status code", async () => {
      const response = await request(app).get("/healthz");

      expect(response.status).toBe(200);
    });

    it("should return correct response structure", async () => {
      const response = await request(app).get("/healthz");

      expect(response.body).toHaveProperty("status");
      expect(response.body.status).toBe("ok");
    });

    it("should return JSON content type", async () => {
      const response = await request(app).get("/healthz");

      expect(response.headers["content-type"]).toMatch(/json/);
    });

    it("should handle concurrent requests", async () => {
      const requests = Array.from({ length: 10 }, () =>
        request(app).get("/healthz")
      );

      const responses = await Promise.all(requests);

      responses.forEach((response) => {
        expect(response.status).toBe(200);
        expect(response.body.status).toBe("ok");
      });
    });

    it("should be lightweight and fast", async () => {
      const startTime = Date.now();
      await request(app).get("/healthz");
      const endTime = Date.now();

      // Health check should respond within 100ms
      expect(endTime - startTime).toBeLessThan(100);
    });
  });

  describe("Response Validation", () => {
    it("should conform to HealthCheckResponse schema", async () => {
      const response = await request(app).get("/healthz");

      // Basic structure validation
      expect(typeof response.body).toBe("object");
      expect(Object.keys(response.body)).toEqual(["status"]);
      expect(typeof response.body.status).toBe("string");
    });

    it("should not expose sensitive information", async () => {
      const response = await request(app).get("/healthz");

      // Should not contain stack traces, error details, or system info
      expect(response.body).not.toHaveProperty("error");
      expect(response.body).not.toHaveProperty("stack");
      expect(response.body).not.toHaveProperty("version");
      expect(response.body).not.toHaveProperty("timestamp");
    });
  });

  describe("Edge Cases", () => {
    it("should handle requests with query parameters", async () => {
      const response = await request(app).get("/healthz?verbose=true");

      expect(response.status).toBe(200);
      expect(response.body.status).toBe("ok");
    });

    it("should handle requests with headers", async () => {
      const response = await request(app)
        .get("/healthz")
        .set("User-Agent", "Test-Agent/1.0")
        .set("Accept", "application/json");

      expect(response.status).toBe(200);
      expect(response.body.status).toBe("ok");
    });
  });
});
