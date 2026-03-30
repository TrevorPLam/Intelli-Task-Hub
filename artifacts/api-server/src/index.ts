import { z } from "zod";
import app from "./app";
import { logger } from "./lib/logger";
import { initializeAuth } from "./middlewares/auth";
import { closePool } from "@workspace/db";
import type { Server } from "node:http";

/**
 * @file Server entry point with startup validation
 * @module index
 *
 * Validates required environment variables at startup using Zod.
 * The server will refuse to start if any required configuration is missing.
 */

// ============================================================================
// Startup Environment Validation
// ============================================================================

const envSchema = z.object({
  PORT: z.string().min(1, "PORT is required"),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  AI_INTEGRATIONS_OPENAI_API_KEY: z
    .string()
    .min(1, "AI_INTEGRATIONS_OPENAI_API_KEY is required"),
  API_SECRET_KEY: z
    .string()
    .min(32, "API_SECRET_KEY must be at least 32 characters long"),
  // Rate limiting configuration (optional, with safe defaults)
  RATE_LIMIT_GENERAL_WINDOW_MS: z.string().optional(),
  RATE_LIMIT_GENERAL_MAX: z.string().optional(),
  RATE_LIMIT_OPENAI_WINDOW_MS: z.string().optional(),
  RATE_LIMIT_OPENAI_MAX: z.string().optional(),
});

// Parse and validate environment variables
// Throws with descriptive message on failure, preventing server start
const env = envSchema.parse(process.env);

// Initialize authentication middleware with validated API secret key
initializeAuth(env.API_SECRET_KEY);

// ============================================================================
// Server Startup
// ============================================================================

const port = Number(env.PORT);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${env.PORT}"`);
}

app.listen(port, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");
});

// ============================================================================
// Graceful Shutdown Handlers
// ============================================================================

/**
 * Perform graceful shutdown of the HTTP server and database connections.
 * Sequence:
 * 1. Stop accepting new connections (server.close())
 * 2. Close idle keep-alive connections (server.closeAllConnections()) - Node 18.2+
 * 3. Close database connection pool (pool.end())
 */
async function shutdown(signal: string, server: Server): Promise<void> {
  logger.info(
    { signal },
    "Received shutdown signal, starting graceful shutdown"
  );

  try {
    // Step 1: Stop accepting new HTTP connections
    await new Promise<void>((resolve, reject) => {
      server.close((err) => {
        if (err) reject(err);
        else resolve();
      });
    });
    logger.info("HTTP server closed (no longer accepting connections)");

    // Step 2: Force close idle keep-alive connections (Node 18.2+)
    if (typeof server.closeAllConnections === "function") {
      server.closeAllConnections();
      logger.info("All idle HTTP connections closed");
    }

    // Step 3: Close database connection pool
    await closePool();
    logger.info("Database connection pool closed");

    logger.info("Graceful shutdown complete");
    process.exit(0);
  } catch (err) {
    logger.error({ err }, "Error during graceful shutdown");
    process.exit(1);
  }
}

// Store server reference for shutdown handlers
const server = app.listen(port, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");
});

// Handle SIGTERM (Docker/Container stop, Kubernetes)
process.on("SIGTERM", () => shutdown("SIGTERM", server));

// Handle SIGINT (Ctrl+C in development)
process.on("SIGINT", () => shutdown("SIGINT", server));
