/**
 * Routes Index Unit Tests
 *
 * Tests main routes configuration and middleware application.
 * Follows 2026 best practices for isolated unit testing.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import express from "express";
import routes from "../index";

describe("Routes Index", () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use("/", routes);
  });

  describe("Route Configuration", () => {
    it("should mount health routes", async () => {
      const response = await request(app).get("/healthz");

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("status");
    });

    it("should mount OpenAI routes under /openai prefix", async () => {
      // Test that the route exists (may return 405 for wrong method or 404 for missing endpoint)
      const response = await request(app).get("/openai");

      // Should not be a 404 for the entire OpenAI router
      expect(response.status).not.toBe(404);
    });

    it("should apply general rate limiter to all routes", async () => {
      const response = await request(app).get("/healthz");

      // Should include rate limit headers
      expect(response.headers).toHaveProperty("ratelimit-limit");
      expect(response.headers).toHaveProperty("ratelimit-remaining");
    });
  });

  describe("Middleware Application", () => {
    it("should apply JSON parsing middleware", async () => {
      const response = await request(app)
        .post("/test-endpoint")
        .send({ test: "data" });

      // Should handle JSON properly (even if route doesn't exist)
      expect(response.status).not.toBe(500);
    });

    it("should handle malformed JSON gracefully", async () => {
      const response = await request(app)
        .post("/test-endpoint")
        .set("Content-Type", "application/json")
        .send('{"invalid": json}');

      // Should handle malformed JSON without crashing
      expect(response.status).toBe(400);
    });
  });

  describe("Route Security", () => {
    it("should not expose internal routes", async () => {
      const response = await request(app).get("/internal");

      expect(response.status).toBe(404);
    });

    it("should handle undefined routes", async () => {
      const response = await request(app).get("/undefined-route");

      expect(response.status).toBe(404);
    });

    it("should handle unsupported HTTP methods", async () => {
      const response = await request(app).patch("/healthz");

      expect(response.status).toBe(404);
    });
  });

  describe("Error Handling", () => {
    it("should handle middleware errors gracefully", async () => {
      // Mock a middleware error
      const mockApp = express();
      mockApp.use((req, res, next) => {
        const error = new Error("Test error");
        next(error);
      });
      mockApp.use("/", routes);

      const response = await request(mockApp).get("/healthz");

      expect(response.status).toBe(500);
    });

    it("should maintain request isolation", async () => {
      // Multiple concurrent requests should not interfere
      const requests = Array.from({ length: 5 }, () =>
        request(app).get("/healthz")
      );

      const responses = await Promise.all(requests);

      responses.forEach((response) => {
        expect(response.status).toBe(200);
        expect(response.body.status).toBe("ok");
      });
    });
  });

  describe("Route Performance", () => {
    it("should respond quickly to health checks", async () => {
      const startTime = Date.now();
      await request(app).get("/healthz");
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(100);
    });

    it("should handle concurrent requests efficiently", async () => {
      const startTime = Date.now();

      const requests = Array.from({ length: 20 }, () =>
        request(app).get("/healthz")
      );

      await Promise.all(requests);
      const endTime = Date.now();

      // Should handle 20 concurrent requests within reasonable time
      expect(endTime - startTime).toBeLessThan(500);
    });
  });
});
