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
    origin: corsOrigins,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-API-Key"],
  }),
);

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
