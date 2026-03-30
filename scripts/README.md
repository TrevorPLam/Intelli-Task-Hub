# @workspace/scripts
Automation and utility scripts for Intelli-Task-Hub monorepo

## Purpose

This package contains essential automation scripts, utilities, and tools for managing the monorepo, handling development workflows, and maintaining project consistency.

## Table of Contents
- [Overview](#overview)
- [Available Scripts](#available-scripts)
- [Usage](#usage)
- [Development](#development)
- [Adding New Scripts](#adding-new-scripts)

## Overview

### Purpose
- **Automation** - Repetitive task automation
- **Development Utilities** - Development workflow helpers
- **Maintenance** - Project maintenance and cleanup
- **Build Tools** - Custom build and deployment utilities

### Script Categories
- **Database Scripts** - Database management and migrations
- **Build Scripts** - Build automation and optimization
- **Development Scripts** - Development environment setup
- **Maintenance Scripts** - Project cleanup and maintenance

## Available Scripts

### Current Scripts

#### Hello Script (`hello.ts`)
```bash
# Example demonstration script
pnpm --filter @workspace/scripts run hello

# This script demonstrates:
# - Package structure
# - Script execution patterns
# - Logging and error handling
```

### Planned Scripts

#### Database Management
```bash
# Initialize development database
pnpm run db:setup

# Reset database to clean state
pnpm run db:reset

# Create database backup
pnpm run db:backup

# Restore database from backup
pnpm run db:restore [backup-file]
```

#### Migration Management
```bash
# Generate new migration
pnpm run db:migration:generate [migration-name]

# Apply pending migrations
pnpm run db:migration:apply

# Rollback last migration
pnpm run db:migration:rollback

# Check migration status
pnpm run db:migration:status
```

#### Build Automation
```bash
# Build all packages for development
pnpm run build:dev

# Build specific package
pnpm run build:dev --filter @workspace/api-server

# Build with watch mode
pnpm run build:dev --watch

# Build for production
pnpm run build:prod

# Build with optimization
pnpm run build:prod --optimize

# Build with analysis
pnpm run build:prod --analyze
```

#### Development Workflow
```bash
# Setup complete development environment
pnpm run dev:setup

# Install all dependencies
pnpm run dev:install

# Setup git hooks
pnpm run dev:setup-hooks

# Verify development setup
pnpm run dev:verify

# Start all development servers
pnpm run dev:start

# Start specific services
pnpm run dev:start --services api,db

# Start with hot reload
pnpm run dev:start --hot-reload
```

#### Post-Merge Automation
```bash
# Run post-merge tasks
pnpm run post-merge

# This script will:
# 1. Update dependencies
# 2. Run tests
# 3. Build packages
# 4. Update documentation
# 5. Notify team of changes
```

#### Maintenance Scripts
```bash
# Clean all build artifacts
pnpm run clean:all

# Clean node modules
pnpm run clean:modules

# Clean cache files
pnpm run clean:cache

# Clean temporary files
pnpm run clean:temp
```

#### Dependency Management
```bash
# Update all dependencies
pnpm run deps:update

# Check for outdated dependencies
pnpm run deps:check

# Audit dependencies for security
pnpm run deps:audit

# Fix dependency issues
pnpm run deps:fix
```

#### Code Quality
```bash
# Run all linting
pnpm run lint:all

# Fix linting issues
pnpm run lint:fix

# Run type checking
pnpm run typecheck:all

# Format all code
pnpm run format:all
```

## Usage

### Running Scripts

#### Basic Usage
```bash
# Run script from package.json
pnpm run [script-name]

# Run script with arguments
pnpm run [script-name] -- [args]

# Run script in specific package
pnpm --filter @workspace/scripts run [script-name]
```

#### Script Examples

#### Database Setup
```bash
# Initialize fresh development database
pnpm run db:setup

# This script will:
# 1. Check PostgreSQL connection
# 2. Create database if not exists
# 3. Run all pending migrations
# 4. Seed initial data
# 5. Verify setup completion
```

#### Development Workflow
```bash
# Complete development setup
pnpm run dev:setup

# Start development environment
pnpm run dev:start

# This will start:
# - PostgreSQL database
# - API server with hot reload
# - Mobile development server
# - Mock services if needed
```

#### Production Build
```bash
# Build for production deployment
pnpm run build:prod

# This script will:
# 1. Clean previous builds
# 2. Build all packages in dependency order
# 3. Optimize bundles
# 4. Generate build reports
# 5. Verify build integrity
```

## Development

### Script Structure

#### Script Template
```typescript
#!/usr/bin/env tsx

import { program } from 'commander';
import { logger } from '../src/utils/logger';

// Script configuration
program
  .name('script-name')
  .description('Description of what the script does')
  .option('-v, --verbose', 'Enable verbose logging')
  .option('-f, --force', 'Force operation')
  .argument('[optional-argument]', 'Optional argument description')
  .action(async (verbose, force, optionalArg) => {
    try {
      logger.info('Starting script execution...');
      
      // Script logic here
      if (verbose) {
        logger.setLevel('debug');
      }
      
      // Main functionality
      await executeScript(optionalArg, { force, verbose });
      
      logger.info('Script completed successfully');
    } catch (error) {
      logger.error('Script failed:', error);
      process.exit(1);
    }
  });

// Parse command line arguments
program.parse();
```

#### Utility Functions
```typescript
// src/utils/logger.ts
import { createLogger } from 'winston';

export const logger = createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: process.env.NODE_ENV === 'production' 
    ? 'json' 
    : 'simple',
});

// src/utils/process.ts
export async function runCommand(command: string, args: string[] = []) {
  const { spawn } = await import('child_process');  
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: 'inherit',
      env: { ...process.env, FORCE_COLOR: '1' },
    });
    
    child.on('close', (code) => {
      if (code === 0) {
        resolve(code);
      } else {
        reject(new Error(`Command failed with exit code ${code}`));
      }
    });
  });
}

// src/utils/validation.ts
export function validateEnvironment(requiredVars: string[]) {
  const missing = requiredVars.filter(varName => !process.env[varName]);  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}
```

### Error Handling

#### Standardized Error Handling
```typescript
// src/utils/errors.ts
export class ScriptError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly exitCode: number = 1
  ) {
    super(message);
    this.name = 'ScriptError';
  }
}

// Usage in scripts
try {
  await riskyOperation();
} catch (error) {
  if (error instanceof ScriptError) {
    logger.error(`Script error (${error.code}): ${error.message}`);
    process.exit(error.exitCode);
  } else {
    logger.error('Unexpected error:', error);
    process.exit(1);
  }
}
```

#### Progress Indicators
```typescript
// src/utils/progress.ts
import { createSpinner } from 'ora';

export function createProgressSpinner(text: string) {
  return createSpinner({
    text,
    spinner: 'dots',
    color: 'cyan',
  });
}

// Usage
const spinner = createProgressSpinner('Processing files...');
spinner.start();

try {
  await processFiles();
  spinner.succeed('Files processed successfully');
} catch (error) {
  spinner.fail('Failed to process files');
  throw error;
}
```

## Adding New Scripts

### Creating a New Script

#### 1. Create Script File
```bash
# Create new script file
touch src/scripts/new-script.ts

# Make it executable
chmod +x src/scripts/new-script.ts
```

#### 2. Implement Script Logic
```typescript
#!/usr/bin/env tsx

import { program } from 'commander';
import { logger } from '../utils/logger';
import { validateEnvironment } from '../utils/validation';

program
  .name('new-script')
  .description('Description of new script')
  .option('-e, --env <env>', 'Target environment', 'development')
  .option('-d, --dry-run', 'Dry run mode')
  .action(async (env, dryRun) => {
    try {
      logger.info(`Running new-script for ${env} environment`);
      
      if (dryRun) {
        logger.info('Dry run mode - no changes will be made');
      }
      
      // Validate required environment
      validateEnvironment(['DATABASE_URL', 'API_KEY']);
      
      // Main script logic
      await executeNewScript({ env, dryRun });
      
      logger.info('Script completed successfully');
    } catch (error) {
      logger.error('Script failed:', error);
      process.exit(1);
    }
  });

program.parse();

async function executeNewScript(options: { env: string; dryRun: boolean }) {
  // Implementation here
  logger.info('Executing new script logic...');  
  if (!options.dryRun) {
    // Perform actual operations
  }
}
```

#### 3. Add to Package.json
```json
{
  "scripts": {
    "new-script": "tsx src/scripts/new-script.ts",
    "new-script:prod": "NODE_ENV=production tsx src/scripts/new-script.ts"
  }
}
```

#### 4. Update Documentation
```markdown
# Add to this README.md

## New Script

### Description
Brief description of what the script does.

### Usage
```bash
# Basic usage
pnpm run new-script

# With options
pnpm run new-script -- --env production --dry-run

# Production environment
pnpm run new-script:prod
```

### Options
- `--env <environment>` - Target environment (default: development)
- `--dry-run` - Dry run mode without making changes

### Examples
```bash
# Development environment
pnpm run new-script

# Production dry run
pnpm run new-script --env production --dry-run
```
```

### Script Best Practices

#### Code Quality
- **TypeScript** - Use TypeScript for all scripts
- **Error Handling** - Implement comprehensive error handling
- **Logging** - Use structured logging throughout
- **Validation** - Validate inputs and environment

#### User Experience
- **Help Text** - Provide clear help and usage information
- **Progress Indicators** - Show progress for long-running operations
- **Dry Run Mode** - Support dry run for destructive operations
- **Verbose Mode** - Provide detailed logging when requested

#### Performance
- **Async Operations** - Use async/await for I/O operations
- **Parallel Processing** - Process multiple items in parallel when possible
- **Resource Cleanup** - Properly cleanup resources and temporary files
- **Exit Codes** - Use appropriate exit codes for different scenarios

## Dependencies

### Runtime Dependencies
- `tsx` - TypeScript execution engine
- `commander` - Command line interface framework
- `winston` - Logging framework
- `ora` - Progress indicators
- `inquirer` - Interactive command line prompts

### Development Dependencies
- `typescript` - TypeScript compiler
- `@types/node` - Node.js type definitions

## Configuration

### Script Configuration
```typescript
// src/config/scripts.ts
export const scriptConfig = {
  defaultTimeout: 30000, // 30 seconds
  maxRetries: 3,
  retryDelay: 1000,
  tempDir: '/tmp/intelli-task-hub-scripts',
  logLevel: process.env.LOG_LEVEL || 'info',
};
```

### Environment Variables
```bash
# Script Configuration
SCRIPT_TIMEOUT=30000
SCRIPT_MAX_RETRIES=3
SCRIPT_LOG_LEVEL=info
SCRIPT_TEMP_DIR=/tmp/intelli-task-hub-scripts

# Feature Flags
SCRIPT_ENABLE_ANALYTICS=false
SCRIPT_ENABLE_DRY_RUN=true
```

## Troubleshooting

### Common Issues

#### Permission Errors
```bash
# Make script executable
chmod +x src/scripts/script-name.ts

# Check file permissions
ls -la src/scripts/
```

#### Environment Issues
```bash
# Check required environment variables
env | grep -E "(DATABASE_URL|API_KEY)"

# Set missing variables
export DATABASE_URL="postgresql://..."
export API_KEY="your-api-key"
```

#### Dependency Issues
```bash
# Reinstall dependencies
pnpm install

# Clear npm cache
pnpm store prune
```

### Debug Mode
```bash
# Enable debug logging
DEBUG=scripts:* pnpm run script-name

# Run with Node.js inspector
node --inspect node_modules/.bin/tsx src/scripts/script-name.ts
```

## Related Components

- **Configuration** - Scripts use configuration from `src/config/`
- **Utilities** - Shared utilities in `src/utils/`
- **Monorepo** - Scripts operate on the entire monorepo

## Support

For script-related issues:
- Check script documentation and help text
- Review error logs and output
- Submit [GitHub Issues](https://github.com/TrevorPLam/Intelli-Task-Hub/issues)

## License

MIT License - see the main project [LICENSE](../LICENSE) file for details.
