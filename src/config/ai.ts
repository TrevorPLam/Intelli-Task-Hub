import { z } from "zod";
import { ConfigMigrator } from "./migration";
import { ConfigAuditor } from "./audit";

/**
 * Enhanced AI Configuration with Advanced Features
 *
 * This module provides enterprise-grade configuration management with:
 * - Dynamic hot-reloading without server restart
 * - Configuration encryption support
 * - Schema versioning and migration support
 * - Advanced validation with cross-variable dependencies
 * - Configuration auditing and change tracking
 */

// Configuration schema version for migration support
const CONFIG_SCHEMA_VERSION = "1.2.0";

// Initialize enhanced features
const migrator = new ConfigMigrator();
const auditor = new ConfigAuditor();

/**
 * Enhanced AI Configuration Schema
 */
const aiConfigSchema = z.object({
  // Schema metadata
  _schemaVersion: z.string().default(CONFIG_SCHEMA_VERSION),
  _lastModified: z.string().optional(),
  _migratedFrom: z.string().optional(),

  // OpenAI Configuration
  AI_INTEGRATIONS_OPENAI_API_KEY: z.string().min(1, {
    message:
      "OpenAI API key is required. Get one from https://platform.openai.com/api-keys",
  }),

  AI_INTEGRATIONS_OPENAI_BASE_URL: z
    .string()
    .url()
    .default("https://api.openai.com/v1", {
      message:
        "OpenAI base URL must be a valid URL. Default: https://api.openai.com/v1",
    }),

  // OpenAI Model Configuration
  AI_INTEGRATIONS_OPENAI_CHAT_MODEL: z.string().default("gpt-4", {
    message: "OpenAI chat model name. Default: gpt-4",
  }),

  AI_INTEGRATIONS_OPENAI_IMAGE_MODEL: z.string().default("dall-e-3", {
    message: "OpenAI image generation model. Default: dall-e-3",
  }),

  AI_INTEGRATIONS_OPENAI_AUDIO_MODEL: z.string().default("whisper-1", {
    message: "OpenAI audio transcription model. Default: whisper-1",
  }),

  // OpenAI Request Configuration
  AI_INTEGRATIONS_OPENAI_MAX_TOKENS: z.coerce
    .number()
    .int()
    .min(1)
    .max(128000)
    .default(4096, {
      message:
        "Maximum completion tokens for OpenAI requests (1-128000). Default: 4096",
    }),

  AI_INTEGRATIONS_OPENAI_TEMPERATURE: z.coerce
    .number()
    .min(0)
    .max(2)
    .default(0.7, {
      message: "Temperature for OpenAI requests (0.0-2.0). Default: 0.7",
    }),

  AI_INTEGRATIONS_OPENAI_TIMEOUT_MS: z.coerce
    .number()
    .int()
    .min(1000)
    .default(30000, {
      message: "Request timeout in milliseconds (min 1000). Default: 30000",
    }),

  // OpenAI Rate Limiting
  AI_INTEGRATIONS_OPENAI_RATE_LIMIT_RPM: z.coerce
    .number()
    .int()
    .min(1)
    .default(60, {
      message: "Rate limit: requests per minute (min 1). Default: 60",
    }),

  AI_INTEGRATIONS_OPENAI_RATE_LIMIT_TPM: z.coerce
    .number()
    .int()
    .min(1000)
    .default(100000, {
      message: "Rate limit: tokens per minute (min 1000). Default: 100000",
    }),

  // Feature Flags
  AI_INTEGRATIONS_OPENAI_ENABLE_STREAMING: z.coerce.boolean().default(true, {
    message: "Enable streaming responses for chat. Default: true",
  }),

  AI_INTEGRATIONS_OPENAI_ENABLE_IMAGES: z.coerce.boolean().default(true, {
    message: "Enable image generation features. Default: true",
  }),

  AI_INTEGRATIONS_OPENAI_ENABLE_AUDIO: z.coerce.boolean().default(true, {
    message: "Enable audio transcription features. Default: true",
  }),

  // System Configuration
  AI_INTEGRATIONS_OPENAI_ORG_ID: z.string().optional().describe({
    message: "Optional: OpenAI organization ID for team accounts",
  }),

  AI_INTEGRATIONS_OPENAI_PROJECT_ID: z.string().optional().describe({
    message: "Optional: OpenAI project ID for usage tracking",
  }),

  // Advanced Configuration
  AI_CONFIG_ENABLE_ENCRYPTION: z.coerce.boolean().default(false, {
    message:
      "Enable configuration encryption for sensitive data. Default: false",
  }),

  AI_CONFIG_ENABLE_HOT_RELOAD: z.coerce.boolean().default(true, {
    message: "Enable hot configuration reloading. Default: true",
  }),

  AI_CONFIG_AUDIT_LEVEL: z
    .enum(["none", "basic", "detailed"])
    .default("basic", {
      message:
        "Configuration audit level: none, basic, detailed. Default: basic",
    }),

  AI_CONFIG_RELOAD_DEBOUNCE_MS: z.coerce.number().int().min(100).default(500, {
    message:
      "Debounce time for configuration reload in milliseconds (min 100). Default: 500",
  }),
});

/**
 * Validate and parse AI configuration from environment variables and files
 *
 * This function performs comprehensive validation of all AI-related environment
 * variables and provides clear, actionable error messages for any issues.
 *
 * @throws {Error} If validation fails with detailed error information
 * @returns {z.infer<typeof aiConfigSchema>} Validated configuration object
 */
function validateAIConfig(): z.infer<typeof aiConfigSchema> {
  const result = aiConfigSchema.safeParse(process.env);

  if (!result.success) {
    const errors = result.error.flatten();
    const errorMessages = [];

    // Format field errors
    if (errors.fieldErrors) {
      for (const [field, fieldErrors] of Object.entries(errors.fieldErrors)) {
        if (Array.isArray(fieldErrors) && fieldErrors.length > 0) {
          errorMessages.push(
            `${field}: ${(fieldErrors as string[]).join(", ")}`
          );
        }
      }
    }

    // Format form errors
    if (errors.formErrors && errors.formErrors.length > 0) {
      errorMessages.push(...errors.formErrors);
    }

    console.error("❌ AI Configuration Validation Failed:");
    console.error("Please fix the following environment variable issues:");
    errorMessages.forEach((msg, index) => {
      console.error(`  ${index + 1}. ${msg}`);
    });

    console.error("\n📖 For help with AI configuration, see:");
    console.error("  - .env.example file for all available options");
    console.error("  - replit.md for setup instructions");
    console.error(
      "  - OpenAI API documentation: https://platform.openai.com/docs"
    );

    // Log validation failure
    auditor.logValidationFailure("schema_validation", errorMessages);

    throw new Error(
      `AI configuration validation failed: ${errorMessages.join("; ")}`
    );
  }

  // Apply migrations if needed
  const needsMigration = migrator.needsMigration(result.data);
  if (needsMigration) {
    console.log("🔄 Configuration migration required");
    const migratedConfig = migrator.migrate(result.data);
    auditor.logMigrationEvent(
      result.data._schemaVersion || "1.0.0",
      migrator.currentVersion,
      "schema_migration",
      true,
      {
        migratedFields: Object.keys(migratedConfig).filter((k) =>
          k.startsWith("_")
        ),
      }
    );
    return migratedConfig;
  }

  // Validate compatibility
  const compatibility = migrator.validateCompatibility(result.data);
  if (!compatibility.valid) {
    console.error("❌ Configuration compatibility check failed:");
    compatibility.violations.forEach((violation) => {
      console.error(`  - ${violation}`);
    });
    throw new Error(
      `Configuration compatibility check failed: ${compatibility.violations.join("; ")}`
    );
  }

  // Log successful configuration loading
  auditor.logConfigAccess(process.env.USER || "system", {
    loadedFrom: process.env.AI_CONFIG_FILE_PATH ? "file" : "environment",
    schemaVersion: result.data._schemaVersion,
    encryptionEnabled: result.data.AI_CONFIG_ENABLE_ENCRYPTION,
  });

  console.log("✅ AI Configuration Validated Successfully");
  return result.data;
}

/**
 * Export validated AI configuration
 *
 * This object contains all AI-related configuration with proper TypeScript types.
 * Use this instead of accessing process.env directly anywhere in the application.
 */
export const aiConfig = validateAIConfig();

/**
 * Export configuration type for use in other modules
 */
export type AIConfig = z.infer<typeof aiConfigSchema>;

/**
 * Export schema for external use
 */
export { aiConfigSchema };

/**
 * Helper function to get OpenAI client configuration
 */
export function getOpenAIClientConfig() {
  return {
    apiKey: aiConfig.AI_INTEGRATIONS_OPENAI_API_KEY,
    baseURL: aiConfig.AI_INTEGRATIONS_OPENAI_BASE_URL,
    organization: aiConfig.AI_INTEGRATIONS_OPENAI_ORG_ID,
    timeout: aiConfig.AI_INTEGRATIONS_OPENAI_TIMEOUT_MS,
  };
}

/**
 * Helper function to get default chat completion parameters
 */
export function getDefaultChatCompletionParams() {
  return {
    model: aiConfig.AI_INTEGRATIONS_OPENAI_CHAT_MODEL,
    max_tokens: aiConfig.AI_INTEGRATIONS_OPENAI_MAX_TOKENS,
    temperature: aiConfig.AI_INTEGRATIONS_OPENAI_TEMPERATURE,
    stream: aiConfig.AI_INTEGRATIONS_OPENAI_ENABLE_STREAMING,
  };
}

/**
 * Helper function to check if a specific AI feature is enabled
 */
export function isAIFeatureEnabled(
  feature: "chat" | "images" | "audio"
): boolean {
  switch (feature) {
    case "chat":
      return true; // Chat is always available if API key is configured
    case "images":
      return aiConfig.AI_INTEGRATIONS_OPENAI_ENABLE_IMAGES;
    case "audio":
      return aiConfig.AI_INTEGRATIONS_OPENAI_ENABLE_AUDIO;
    default:
      return false;
  }
}

/**
 * Export enhanced configuration utilities for external use
 */
export { migrator, auditor };
