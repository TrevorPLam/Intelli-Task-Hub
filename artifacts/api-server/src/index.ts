import { z } from "zod";
import app from "./app";
import { logger } from "./lib/logger";
import { initializeAuth } from "./middlewares/auth";

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
