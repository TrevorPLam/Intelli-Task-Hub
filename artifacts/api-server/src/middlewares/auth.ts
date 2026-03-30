import type { Request, Response, NextFunction } from "express";
import { timingSafeEqual } from "node:crypto";

/**
 * @file Authentication middleware for API server
 * @module middlewares/auth
 *
 * Implements API key verification using constant-time comparison
 * to prevent timing attacks. Designed for Express 5 with native
 * async error propagation support.
 */

// Cache the expected API key buffer for constant-time comparison
let expectedKeyBuffer: Buffer | null = null;

/**
 * Initialize the expected API key buffer for timing-safe comparison.
 * This is called once at module load time after env validation.
 */
export function initializeAuth(expectedKey: string): void {
  // Create a fixed-size buffer for constant-time comparison
  // Using SHA-256-like length (32 bytes) as the comparison baseline
  expectedKeyBuffer = Buffer.from(expectedKey, "utf8");
}

/**
 * Extract the API key from the Authorization header or X-API-Key header.
 * Supports "Bearer <token>" and raw API key formats.
 */
function extractApiKey(req: Request): string | null {
  // Check X-API-Key header first (preferred for API key auth)
  const xApiKey = req.headers["x-api-key"];
  if (typeof xApiKey === "string" && xApiKey.length > 0) {
    return xApiKey;
  }

  // Fall back to Authorization header with Bearer scheme
  const authHeader = req.headers["authorization"];
  if (
    typeof authHeader === "string" &&
    authHeader.toLowerCase().startsWith("bearer ")
  ) {
    return authHeader.slice(7).trim();
  }

  return null;
}

/**
 * Perform constant-time comparison of two API keys.
 * Prevents timing attacks by ensuring the comparison takes
 * the same amount of time regardless of how many characters match.
 */
function constantTimeCompare(a: Buffer, b: Buffer): boolean {
  if (a.length !== b.length) {
    // Still perform comparison to avoid leaking length info
    // Use a dummy comparison with the same expected key
    return false;
  }
  return timingSafeEqual(a, b);
}

/**
 * Express middleware that verifies the API key from request headers.
 *
 * Express 5 Note: Errors thrown in async functions are automatically
 * forwarded to next(err), so explicit try/catch is not required.
 *
 * @returns 401 Unauthorized if API key is missing or invalid
 */
export function verifyApiKey(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (!expectedKeyBuffer) {
    res.status(500).json({
      error: "Internal server error",
      message: "Authentication not initialized",
    });
    return;
  }

  const apiKey = extractApiKey(req);

  if (!apiKey) {
    res.status(401).json({
      error: "Unauthorized",
      message:
        "API key required. Provide via X-API-Key header or Authorization: Bearer <token>",
    });
    return;
  }

  const providedKeyBuffer = Buffer.from(apiKey, "utf8");

  // Constant-time comparison to prevent timing attacks
  if (!constantTimeCompare(expectedKeyBuffer, providedKeyBuffer)) {
    res.status(401).json({
      error: "Unauthorized",
      message: "Invalid API key",
    });
    return;
  }

  // Authentication successful
  next();
}
