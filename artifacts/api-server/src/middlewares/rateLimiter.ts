/**
 * @file Rate limiting middleware for API protection
 * @module middlewares/rateLimiter
 *
 * Provides configurable rate limiting for general API routes and stricter limits
 * for OpenAI endpoints to prevent abuse and control costs.
 *
 * @since 2026-03-30
 * @version 1.0.0
 * @author Intelli-Task-Hub Team
 */

import { rateLimit, type RateLimitRequestHandler } from "express-rate-limit";
import type { Request } from "express";

// ============================================================================
// Key Generator
// ============================================================================

/**
 * Extract client IP for rate limiting key
 * Uses req.ip (set by trust proxy) with fallback to socket remoteAddress
 */
const getClientIp = (req: Request): string => {
  return (req.ip || req.socket?.remoteAddress || "unknown").toString();
};

// ============================================================================
// Environment Configuration
// ============================================================================

const DEFAULT_GENERAL_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const DEFAULT_GENERAL_MAX = 100; // 100 requests per window
const DEFAULT_OPENAI_WINDOW_MS = 60 * 1000; // 1 minute
const DEFAULT_OPENAI_MAX = 20; // 20 requests per minute for OpenAI endpoints

const parseEnvInt = (value: string | undefined, defaultValue: number): number => {
  if (!value) return defaultValue;
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? defaultValue : parsed;
};

// ============================================================================
// Rate Limit Configurations
// ============================================================================

/**
 * General rate limiter applied to all API routes
 * Default: 100 requests per 15 minutes per IP
 */
export const generalLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: parseEnvInt(
    process.env.RATE_LIMIT_GENERAL_WINDOW_MS,
    DEFAULT_GENERAL_WINDOW_MS,
  ),
  limit: parseEnvInt(process.env.RATE_LIMIT_GENERAL_MAX, DEFAULT_GENERAL_MAX),
  standardHeaders: "draft-7",
  legacyHeaders: false,
  keyGenerator: getClientIp,
  message: {
    status: 429,
    error: "Too Many Requests",
    message: "Rate limit exceeded. Please try again later.",
  },
  handler: (req, res, _next, options) => {
    // Get reset time from standard headers or calculate fallback
    const resetTime = res.getHeader("ratelimit-reset");
    const retryAfter = resetTime
      ? Math.max(0, Math.ceil((Number(resetTime) - Date.now()) / 1000))
      : Math.ceil(options.windowMs / 1000);
    res.setHeader("Retry-After", retryAfter);
    res.status(429).json(options.message);
  },
});

/**
 * Stricter rate limiter for OpenAI endpoints
 * Default: 20 requests per minute per IP
 * Rationale: OpenAI API calls are expensive and slower
 */
export const openaiLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: parseEnvInt(
    process.env.RATE_LIMIT_OPENAI_WINDOW_MS,
    DEFAULT_OPENAI_WINDOW_MS,
  ),
  limit: parseEnvInt(process.env.RATE_LIMIT_OPENAI_MAX, DEFAULT_OPENAI_MAX),
  standardHeaders: "draft-7",
  legacyHeaders: false,
  keyGenerator: getClientIp,
  message: {
    status: 429,
    error: "Too Many Requests",
    message: "OpenAI endpoint rate limit exceeded. Please try again later.",
  },
  handler: (req, res, _next, options) => {
    // Get reset time from standard headers or calculate fallback
    const resetTime = res.getHeader("ratelimit-reset");
    const retryAfter = resetTime
      ? Math.max(0, Math.ceil((Number(resetTime) - Date.now()) / 1000))
      : Math.ceil(options.windowMs / 1000);
    res.setHeader("Retry-After", retryAfter);
    res.status(429).json(options.message);
  },
});
