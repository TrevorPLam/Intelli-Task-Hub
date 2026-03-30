import helmet from "helmet";
import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";
import { verifyApiKey } from "./middlewares/auth";

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
    logger.warn("CORS_ALLOWED_ORIGINS not set, defaulting to no cross-origin access");
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
    allowedHeaders: ["Content-Type", "Authorization", "X-API-Key", "X-Request-ID"],
    exposedHeaders: ["X-RateLimit-Limit", "X-RateLimit-Remaining", "X-RateLimit-Reset", "Retry-After"],
    maxAge: 86400, // Cache preflight for 24 hours
  }),
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
  }),
);
app.use(verifyApiKey);
app.use(express.json({ limit: "64kb" }));
app.use(express.urlencoded({ limit: "64kb", extended: false }));

app.use("/api", router);

export default app;
