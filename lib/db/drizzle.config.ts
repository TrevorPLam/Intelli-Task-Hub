/**
 * Drizzle Kit Configuration
 *
 * Configuration for Drizzle ORM migration and schema management tools.
 * Uses production-safe migration workflow with SQL file generation.
 *
 * @fileoverview Drizzle Kit config for PostgreSQL database migrations
 * @version 1.0.0
 * @since 2026-03-30
 * @author Intelli-Task-Hub Team
 */

import { defineConfig } from "drizzle-kit";
import path from "path";

// Ensure DATABASE_URL is available for all operations
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL, ensure the database is provisioned");
}

export default defineConfig({
  // Individual schema files for precise migration generation
  schema: ["./src/schema/conversations.ts", "./src/schema/messages.ts"],
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
  // Output directory for generated SQL migration files
  out: "./migrations",
});
