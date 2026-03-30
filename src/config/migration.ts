import { z } from "zod";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { resolve } from "path";

/**
 * Configuration Migration and Versioning Utility
 * 
 * Provides schema versioning, automatic migration, and compatibility checking
 * for AI configuration management.
 */

// Migration registry for schema versions
interface Migration {
  version: string;
  description: string;
  migrate: (oldConfig: any, targetVersion: string) => any;
}

const migrations: Migration[] = [
  {
    version: "1.0.0",
    description: "Initial schema version",
    migrate: (oldConfig: any, targetVersion: string) => {
      // No migration needed for initial version
      return oldConfig;
    }
  },
  {
    version: "1.1.0",
    description: "Add configuration encryption support",
    migrate: (oldConfig: any, targetVersion: string) => {
      const newConfig = { ...oldConfig };
      
      // Add new encryption field with default false
      (newConfig as any).AI_CONFIG_ENABLE_ENCRYPTION = false;
      
      return newConfig;
    }
  },
  {
    version: "1.2.0",
    description: "Add hot reload and audit features",
    migrate: (oldConfig: any, targetVersion: string) => {
      const newConfig = { ...oldConfig };
      
      // Add new hot reload and audit fields
      (newConfig as any).AI_CONFIG_ENABLE_HOT_RELOAD = true;
      (newConfig as any).AI_CONFIG_RELOAD_DEBOUNCE_MS = 500;
      (newConfig as any).AI_CONFIG_AUDIT_LEVEL = 'basic';
      
      return newConfig;
    }
  }
];

/**
 * Configuration Migration Manager
 */
export class ConfigMigrator {
  private currentVersion = "1.2.0";

  /**
   * Detect current configuration version
   */
  detectVersion(config: any): string {
    return config._schemaVersion || config._migratedFrom || "1.0.0";
  }

  /**
   * Check if migration is needed
   */
  needsMigration(config: any): boolean {
    const currentVersion = this.detectVersion(config);
    return this.compareVersions(currentVersion, this.currentVersion) < 0;
  }

  /**
   * Compare version strings
   */
  private compareVersions(v1: string, v2: string): number {
    const parts1 = v1.split('.').map(Number);
    const parts2 = v2.split('.').map(Number);
    
    for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
      const part1 = parts1[i] || 0;
      const part2 = parts2[i] || 0;
      
      if (part1 > part2) return 1;
      if (part1 < part2) return -1;
    }
    
    return 0;
  }

  /**
   * Apply migrations in sequence
   */
  migrate(config: any): any {
    let currentConfig = { ...config };
    const currentVersion = this.detectVersion(currentConfig);

    // Apply migrations in order
    for (const migration of migrations) {
      if (this.compareVersions(currentVersion, migration.version) < 0) {
        console.log(`🔄 Migrating configuration from ${currentVersion} to ${migration.version}`);
        currentConfig = migration.migrate(currentConfig, migration.version);
        console.log(`✅ Migration to ${migration.version} completed: ${migration.description}`);
      }
    }

    // Update to latest version
    (currentConfig as any)._schemaVersion = this.currentVersion;
    (currentConfig as any)._migratedFrom = currentVersion;

    return currentConfig;
  }

  /**
   * Validate configuration compatibility
   */
  validateCompatibility(config: any): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    const version = this.detectVersion(config);

    // Check for deprecated fields
    if (version === "1.0.0" && (config as any).AI_INTEGRATIONS_OPENAI_BASE_URL === "https://api.openai.com/v1") {
      errors.push("Deprecated base URL format in v1.0.0, please migrate to v1.1.0+");
    }

    // Check for required fields in newer versions
    if (this.compareVersions(version, "1.1.0") >= 0 && !(config as any).AI_CONFIG_ENABLE_HOT_RELOAD !== undefined) {
      errors.push("AI_CONFIG_ENABLE_HOT_RELOAD is required in v1.1.0+");
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Get migration history
   */
  getMigrationHistory(): Migration[] {
    return migrations;
  }
}

export { ConfigMigrator, migrations };
