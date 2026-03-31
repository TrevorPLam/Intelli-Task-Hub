/**
 * Database Module
 *
 * Centralized database configuration with connection pooling, performance monitoring,
 * and optimized schema management. Implements PostgreSQL best practices for 2026.
 *
 * @fileoverview Database connection and query management with performance optimization
 * @version 2.0.0
 * @since 2026-03-30
 * @author Intelli-Task-Hub Team
 */

import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

// =============================================================================
// Configuration from Environment Variables
// =============================================================================

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?"
  );
}

// Connection Pool Configuration (2026 Best Practices)
// Based on: https://last9.io/blog/postgresql-performance/
const POOL_CONFIG = {
  // Maximum connections in pool (rule: max(4 × CPU cores, 100))
  // Default 20 is suitable for most workloads without overwhelming PostgreSQL
  max: parseInt(process.env.DB_POOL_MAX || "20", 10),

  // Idle timeout: 30 seconds (release idle connections quickly)
  idleTimeoutMillis: parseInt(
    process.env.DB_POOL_IDLE_TIMEOUT_MS || "30000",
    10
  ),

  // Connection timeout: 5 seconds (fail fast on connection issues)
  connectionTimeoutMillis: parseInt(
    process.env.DB_POOL_CONNECTION_TIMEOUT_MS || "5000",
    10
  ),

  // Connection string
  connectionString: process.env.DATABASE_URL,
};

// =============================================================================
// Connection Pool and Database Instance
// =============================================================================

export const pool = new Pool(POOL_CONFIG);

// Create Drizzle instance with schema
export const db: NodePgDatabase<typeof schema> = drizzle(pool, { schema });

// =============================================================================
// Query Performance Monitoring
// =============================================================================

interface QueryMetrics {
  query: string;
  duration: number;
  timestamp: Date;
  slow: boolean;
}

const SLOW_QUERY_THRESHOLD_MS = parseInt(
  process.env.DB_SLOW_QUERY_THRESHOLD_MS || "100",
  10
);
const queryMetrics: QueryMetrics[] = [];
const MAX_STORED_METRICS = 1000;

/**
 * Log a query for performance monitoring
 */
export function logQuery(query: string, duration: number): void {
  const isSlow = duration > SLOW_QUERY_THRESHOLD_MS;
  const metric: QueryMetrics = {
    query,
    duration,
    timestamp: new Date(),
    slow: isSlow,
  };

  // Store metric (limit array size for memory efficiency)
  queryMetrics.push(metric);
  if (queryMetrics.length > MAX_STORED_METRICS) {
    queryMetrics.shift();
  }

  // Log slow queries immediately
  if (isSlow && process.env.NODE_ENV !== "test") {
    console.warn(`[SLOW QUERY] ${duration}ms: ${query.substring(0, 200)}...`);
  }
}

/**
 * Get query performance statistics
 */
export function getQueryStats(): {
  totalQueries: number;
  slowQueries: number;
  averageDuration: number;
  p95Duration: number;
  recentSlowQueries: QueryMetrics[];
} {
  if (queryMetrics.length === 0) {
    return {
      totalQueries: 0,
      slowQueries: 0,
      averageDuration: 0,
      p95Duration: 0,
      recentSlowQueries: [],
    };
  }

  const durations = queryMetrics.map((m) => m.duration);
  const sorted = [...durations].sort((a, b) => a - b);
  const p95Index = Math.floor(sorted.length * 0.95);

  return {
    totalQueries: queryMetrics.length,
    slowQueries: queryMetrics.filter((m) => m.slow).length,
    averageDuration: durations.reduce((a, b) => a + b, 0) / durations.length,
    p95Duration: sorted[p95Index] || 0,
    recentSlowQueries: queryMetrics.filter((m) => m.slow).slice(-10),
  };
}

/**
 * Clear query metrics (useful for testing)
 */
export function clearQueryMetrics(): void {
  queryMetrics.length = 0;
}

// =============================================================================
// Connection Pool Monitoring
// =============================================================================

export interface PoolStats {
  totalCount: number;
  idleCount: number;
  waitingCount: number;
}

/**
 * Get current connection pool statistics
 */
export function getPoolStats(): PoolStats {
  return {
    totalCount: pool.totalCount,
    idleCount: pool.idleCount,
    waitingCount: pool.waitingCount,
  };
}

// =============================================================================
// Health Check
// =============================================================================

/**
 * Check database connectivity and pool health
 */
export async function checkDatabaseHealth(): Promise<{
  healthy: boolean;
  responseTime: number;
  error?: string;
}> {
  const start = Date.now();
  try {
    const client = await pool.connect();
    await client.query("SELECT 1");
    client.release();
    return {
      healthy: true,
      responseTime: Date.now() - start,
    };
  } catch (err) {
    return {
      healthy: false,
      responseTime: Date.now() - start,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

// =============================================================================
// Graceful Shutdown
// =============================================================================

/**
 * Close the database connection pool gracefully.
 * All in-flight queries will complete before connections are terminated.
 */
export async function closePool(): Promise<void> {
  console.log("Closing database connection pool...");
  await pool.end();
  console.log("Database connection pool closed.");
}

// =============================================================================
// Pool Event Listeners (for monitoring)
// =============================================================================

if (process.env.NODE_ENV !== "test") {
  pool.on("connect", () => {
    // Connection established (rarely logged to avoid noise)
  });

  pool.on("acquire", () => {
    // Connection acquired from pool
  });

  pool.on("remove", () => {
    // Connection removed from pool
  });

  pool.on("error", (err: Error) => {
    console.error("Unexpected database pool error:", err.message);
  });
}

// =============================================================================
// Exports
// =============================================================================

export * from "./schema";
