/**
 * Global Test Setup for Intelli-Task-Hub
 *
 * This file runs once before all test suites and sets up the test database.
 * Follows 2026 best practices for test isolation and database management.
 *
 * @fileoverview Global test configuration and database setup
 * @version 1.0.0
 * @since 2026-03-30
 * @author Intelli-Task-Hub Team
 */

import { execSync } from "child_process";
import path from "path";

// Test database configuration
const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL || "postgresql://test_user:test_password@localhost:5433/intellitaskhub_test";

export async function setup() {
  console.log("🚀 Setting up test environment...");
  
  // Set test database URL for all tests
  process.env.DATABASE_URL = TEST_DATABASE_URL;
  process.env.NODE_ENV = "test";
  
  try {
    // Start test database if not already running
    console.log("📦 Starting test database...");
    execSync("docker-compose -f docker-compose.test.yml up -d", { 
      stdio: "pipe",
      cwd: path.resolve(__dirname, "../..")
    });
    
    // Wait for database to be ready
    console.log("⏳ Waiting for database to be ready...");
    let retries = 30;
    while (retries > 0) {
      try {
        execSync("docker-compose -f docker-compose.test.yml exec -T test-db pg_isready -U test_user -d intellitaskhub_test", {
          stdio: "pipe",
          cwd: path.resolve(__dirname, "../..")
        });
        break;
      } catch {
        retries--;
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    if (retries === 0) {
      throw new Error("Test database failed to start after 30 seconds");
    }
    
    console.log("✅ Test database is ready!");
    
    // Run database migrations
    console.log("🔄 Running database migrations...");
    execSync("pnpm drizzle-kit push", { 
      stdio: "pipe",
      cwd: path.resolve(__dirname, "../../lib/db")
    });
    
    console.log("🎉 Test environment setup complete!");
    
  } catch (error) {
    console.error("❌ Failed to setup test environment:", error);
    process.exit(1);
  }
}

export async function teardown() {
  console.log("🧹 Cleaning up test environment...");
  
  try {
    // Stop test database
    execSync("docker-compose -f docker-compose.test.yml down", {
      stdio: "pipe",
      cwd: path.resolve(__dirname, "../..")
    });
    
    console.log("✅ Test environment cleanup complete!");
  } catch (error) {
    console.error("❌ Failed to cleanup test environment:", error);
  }
}
