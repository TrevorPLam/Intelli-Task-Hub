import helmet from "helmet";
import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";
import { verifyApiKey } from "./middlewares/auth";
import { responseFormatterMiddleware } from "./middlewares/response";
import { trackError } from "./lib/error-aggregator";
import { ProblemTypes } from "./lib/problem-types";

// Parse CORS allowlist from environment
function parseCorsOrigins(): string[] | boolean {
  const env = process.env.NODE_ENV || "development";
  const allowedOrigins = process.env.CORS_ALLOWED_ORIGINS;

  // In development, allow wildcard if no explicit allowlist is set
  if (env === "development" && !allowedOrigins) {
    return true;
  }

  // Require explicit allowlist in production
  if (!allowedOrigins) {
    logger.warn(
      "CORS_ALLOWED_ORIGINS not set, defaulting to no cross-origin access"
    );
    return false;
  }

  // Parse comma-separated origins, trim whitespace, remove trailing slashes
  return allowedOrigins
    .split(",")
    .map((origin) => origin.trim().replace(/\/$/, ""))
    .filter((origin) => origin.length > 0);
}

const corsOrigins = parseCorsOrigins();

const app: Express = express();

// Trust proxy for correct IP identification behind reverse proxies (Replit, etc.)
app.set("trust proxy", 1);

// ============================================================================
// Security Middleware (First)
// ============================================================================

app.use(helmet());

// CORS must be registered BEFORE auth middleware so preflight requests are not rejected
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (server-to-server, mobile apps, curl, Postman)
      if (!origin) return callback(null, true);

      const allowed = corsOrigins;
      if (allowed === true) {
        // Development wildcard mode
        return callback(null, true);
      }
      if (Array.isArray(allowed) && allowed.includes(origin)) {
        return callback(null, true);
      }

      // Reject with logging for security monitoring
      logger.warn({ origin }, "CORS request rejected: origin not in allowlist");
      callback(new Error(`CORS: Origin ${origin} not allowed`));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-API-Key",
      "X-Request-ID",
    ],
    exposedHeaders: [
      "X-RateLimit-Limit",
      "X-RateLimit-Remaining",
      "X-RateLimit-Reset",
      "Retry-After",
    ],
    maxAge: 86400, // Cache preflight for 24 hours
  })
);

// Add Vary: Origin header when using dynamic origin validation
app.use((req, res, next) => {
  if (Array.isArray(corsOrigins) && corsOrigins.length > 1) {
    res.vary("Origin");
  }
  next();
});

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  })
);
app.use(verifyApiKey);
app.use(express.json({ limit: "64kb" }));
app.use(express.urlencoded({ limit: "64kb", extended: false }));
app.use(responseFormatterMiddleware());

app.use("/api", router);

// ============================================================================
// Global Error Handler (Last Middleware)
// ============================================================================
app.use(
  (
    err: Error,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    // Generate unique error ID for correlation
    const errorId = crypto.randomUUID();

    // Determine problem type and severity based on error type
    let problemType = ProblemTypes.INTERNAL_ERROR;
    const severity: "low" | "medium" | "high" | "critical" =
      err.name === "UnauthorizedError"
        ? "medium"
        : err.name === "ValidationError"
          ? "low"
          : err.name === "DatabaseError"
            ? "high"
            : "high";

    // Map error name to problem type
    if (err.name === "ValidationError") {
      problemType = ProblemTypes.VALIDATION_ERROR;
    } else if (err.name === "UnauthorizedError") {
      problemType = ProblemTypes.UNAUTHORIZED;
    } else if (err.name === "DatabaseError") {
      problemType = ProblemTypes.DATABASE_ERROR;
    }

    // Track error in aggregator for monitoring and alerting
    trackError({
      severity,
      type: err.name || "UNKNOWN_ERROR",
      message: err.message,
      stack: err.stack,
      context: {
        correlationId: errorId,
        method: req.method,
        path: req.path,
        userAgent: req.get("User-Agent"),
        ip: req.ip,
      },
    });

    // Log error with full context using Pino
    logger.error(
      {
        errorId,
        err: {
          name: err.name,
          message: err.message,
          stack: err.stack,
        },
        req: {
          method: req.method,
          url: req.url?.split("?")[0],
          path: req.path,
          userAgent: req.get("User-Agent"),
          ip: req.ip,
        },
      },
      "Unhandled route error"
    );

    // Use RFC 7807 Problem Details format for error response
    const isDevelopment = process.env.NODE_ENV === "development";

    res.problem(
      problemType.status,
      problemType.title,
      problemType.description,
      {
        errorId,
        type: problemType.uri,
        resolution: problemType.resolution,
        severity: problemType.severity,
        ...(isDevelopment && {
          debug: {
            message: err.message,
            stack: err.stack,
          },
        }),
      }
    );
  }
);

export default app;
