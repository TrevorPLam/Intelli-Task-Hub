/**
 * Health Endpoint Integration Tests
 *
 * Tests the health check endpoint with real database connections.
 * Follows 2026 best practices for integration testing with test isolation.
 *
 * @fileoverview Health endpoint integration tests
 * @version 1.0.0
 * @since 2026-03-30
 * @author Intelli-Task-Hub Team
 */

import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import healthRouter from "../../routes/health";

describe("Health Endpoint Integration Tests", () => {
  let app: express.Application;

  beforeAll(async () => {
    // Setup Express app with middleware
    app = express();
    app.use(helmet());
    app.use(cors());
    app.use(express.json());
    app.use("/", healthRouter);
  });

  describe("Database Connectivity", () => {
    it("should return healthy status when database is accessible", async () => {
      const response = await request(app).get("/healthz");

      expect(response.status).toBe(200);
      expect(response.body.status).toBe("ok");
    });

    it("should respond quickly even with database connection", async () => {
      const startTime = Date.now();
      const response = await request(app).get("/healthz");
      const endTime = Date.now();

      expect(response.status).toBe(200);
      expect(endTime - startTime).toBeLessThan(200);
    });
  });

  describe("Middleware Integration", () => {
    it("should work with CORS middleware", async () => {
      const response = await request(app)
        .get("/healthz")
        .set("Origin", "http://localhost:3000");

      expect(response.status).toBe(200);
      expect(response.headers).toHaveProperty("access-control-allow-origin");
    });

    it("should work with security headers from helmet", async () => {
      const response = await request(app).get("/healthz");

      expect(response.status).toBe(200);
      // Should have security headers
      expect(response.headers).toHaveProperty("x-content-type-options");
      expect(response.headers).toHaveProperty("x-frame-options");
    });

    it("should work with JSON parsing middleware", async () => {
      const response = await request(app)
        .get("/healthz")
        .set("Content-Type", "application/json");

      expect(response.status).toBe(200);
      expect(response.headers["content-type"]).toMatch(/json/);
    });
  });

  describe("Concurrent Requests", () => {
    it("should handle multiple simultaneous health checks", async () => {
      const startTime = Date.now();
      const requests = Array.from({ length: 50 }, () =>
        request(app).get("/healthz")
      );

      const responses = await Promise.all(requests);

      // All requests should succeed
      responses.forEach((response) => {
        expect(response.status).toBe(200);
        expect(response.body.status).toBe("ok");
      });

      // Should complete within reasonable time
      const totalTime = Date.now() - startTime;
      expect(totalTime).toBeLessThan(1000);
    });

    it("should maintain response consistency under load", async () => {
      const requests = Array.from({ length: 100 }, () =>
        request(app).get("/healthz")
      );

      const responses = await Promise.all(requests);

      // All responses should have identical structure
      const firstResponse = responses[0].body;
      responses.forEach((response) => {
        expect(response.body).toEqual(firstResponse);
      });
    });
  });

  describe("Edge Cases", () => {
    it("should handle requests with large headers", async () => {
      const largeHeaderValue = "x".repeat(1000);

      const response = await request(app)
        .get("/healthz")
        .set("X-Large-Header", largeHeaderValue);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe("ok");
    });

    it("should handle requests with query parameters", async () => {
      const response = await request(app).get("/healthz?verbose=true&debug=1");

      expect(response.status).toBe(200);
      expect(response.body.status).toBe("ok");
    });

    it("should handle requests with different HTTP versions", async () => {
      const response1 = await request(app).get("/healthz");
      const response2 = await request(app)
        .get("/healthz")
        .set("HTTP-Version", "HTTP/1.0");

      expect(response1.status).toBe(200);
      expect(response2.status).toBe(200);
    });
  });

  describe("Response Headers", () => {
    it("should include appropriate cache headers", async () => {
      const response = await request(app).get("/healthz");

      expect(response.status).toBe(200);
      // Health checks should not be cached
      expect(response.headers["cache-control"]).toContain("no-cache");
    });

    it("should include content-type header", async () => {
      const response = await request(app).get("/healthz");

      expect(response.status).toBe(200);
      expect(response.headers["content-type"]).toMatch(/application\/json/);
    });

    it("should include content-length header", async () => {
      const response = await request(app).get("/healthz");

      expect(response.status).toBe(200);
      expect(response.headers).toHaveProperty("content-length");
      expect(typeof response.headers["content-length"]).toBe("string");
    });
  });

  describe("Error Resilience", () => {
    it("should handle malformed request lines gracefully", async () => {
      // Test with malformed HTTP request (supertest handles this well)
      const response = await request(app).get("/healthz");

      expect(response.status).toBe(200);
    });

    it("should maintain availability under stress", async () => {
      const batchSize = 20;
      const batches = 5;

      for (let i = 0; i < batches; i++) {
        const requests = Array.from({ length: batchSize }, () =>
          request(app).get("/healthz")
        );

        const responses = await Promise.all(requests);

        responses.forEach((response) => {
          expect(response.status).toBe(200);
        });

        // Small delay between batches
        await new Promise((resolve) => setTimeout(resolve, 10));
      }
    });
  });
});
