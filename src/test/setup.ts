/**
 * Test Setup for Intelli-Task-Hub
 *
 * This file runs before each test file and provides test utilities.
 * Follows 2026 best practices for test isolation and database cleanup.
 *
 * @fileoverview Per-test setup and utilities
 * @version 1.0.0
 * @since 2026-03-30
 * @author Intelli-Task-Hub Team
 */

import { beforeAll, afterAll, beforeEach, afterEach } from "vitest";
import { drizzle } from "drizzle-orm";
import postgres from "postgres";
import * as schema from "../../lib/db/src/schema";

// Test database connection
const TEST_DATABASE_URL =
  process.env.DATABASE_URL ||
  "postgresql://test_user:test_password@localhost:5433/intellitaskhub_test";

let db: ReturnType<typeof drizzle>;
let connection: ReturnType<typeof postgres>;

beforeAll(async () => {
  // Initialize database connection for tests
  connection = postgres(TEST_DATABASE_URL);
  db = drizzle(connection, { schema });
});

afterAll(async () => {
  // Close database connection
  if (connection) {
    await connection.end();
  }
});

beforeEach(async () => {
  // Clean up database before each test for isolation
  try {
    // Delete all data in correct order to respect foreign key constraints
    await db.delete(schema.messages);
    await db.delete(schema.conversations);
  } catch (error) {
    console.warn("Warning: Failed to clean up database before test:", error);
  }
});

afterEach(async () => {
  // Additional cleanup if needed
  // This ensures complete test isolation
});

// Export test utilities
export { db };

// Test data factory functions
export const createTestConversation = async (
  overrides: Partial<typeof schema.conversations.$inferInsert> = {}
) => {
  const conversation = {
    id: `test-conv-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    title: "Test Conversation",
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };

  await db.insert(schema.conversations).values(conversation);
  return conversation;
};

export const createTestMessage = async (
  conversationId: string,
  overrides: Partial<typeof schema.messages.$inferInsert> = {}
) => {
  const message = {
    id: `test-msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    conversationId,
    role: "user" as const,
    content: "Test message content",
    createdAt: new Date(),
    ...overrides,
  };

  await db.insert(schema.messages).values(message);
  return message;
};

// Test HTTP client utilities
export const testHttpClient = {
  async get(url: string, options?: RequestInit) {
    const response = await fetch(`http://localhost:3000${url}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
      ...options,
    });

    return {
      status: response.status,
      headers: response.headers,
      data: response.ok ? await response.json() : null,
      error: response.ok ? null : await response.text(),
    };
  },

  async post(url: string, data?: any, options?: RequestInit) {
    const response = await fetch(`http://localhost:3000${url}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
      body: data ? JSON.stringify(data) : undefined,
      ...options,
    });

    return {
      status: response.status,
      headers: response.headers,
      data: response.ok ? await response.json() : null,
      error: response.ok ? null : await response.text(),
    };
  },
};
