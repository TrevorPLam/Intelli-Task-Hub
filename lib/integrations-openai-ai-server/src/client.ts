import OpenAI from "openai";
import { getOpenAIClientConfig } from "../../../src/config/ai";

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

/**
 * Singleton OpenAI client instance
 *
 * ESM module caching ensures this is created only once per process.
 * All modules importing this will receive the same instance.
 *
 * Configuration is sourced from the centralized AI configuration module
 * which provides type safety and validation.
 */
export const openai = new OpenAI(getOpenAIClientConfig());

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
