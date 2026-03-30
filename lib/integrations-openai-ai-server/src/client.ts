import OpenAI from "openai";

/**
 * Shared OpenAI Client Factory
 *
 * This module provides a singleton OpenAI client instance that is shared
 * across the entire application. Using a singleton pattern ensures:
 * - Consistent configuration across all OpenAI API calls
 * - Efficient resource usage (single HTTP client)
 * - Simplified testing and mocking
 * - Centralized environment variable validation
 */

// Validate environment variables at module load time
if (!process.env.AI_INTEGRATIONS_OPENAI_BASE_URL) {
  throw new Error(
    "AI_INTEGRATIONS_OPENAI_BASE_URL must be set. Did you forget to provision the OpenAI AI integration?"
  );
}

if (!process.env.AI_INTEGRATIONS_OPENAI_API_KEY) {
  throw new Error(
    "AI_INTEGRATIONS_OPENAI_API_KEY must be set. Did you forget to provision the OpenAI AI integration?"
  );
}

/**
 * Singleton OpenAI client instance
 *
 * ESM module caching ensures this is created only once per process.
 * All modules importing this will receive the same instance.
 */
export const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

/**
 * Get the OpenAI client instance
 *
 * This function provides a clean interface for accessing the singleton
 * OpenAI client. It can be used in tests to provide a mock instance.
 *
 * @returns The OpenAI client instance
 */
export function getOpenAIClient(): OpenAI {
  return openai;
}
