# Source Code
> Core configuration, mocks, and testing utilities for the Intelli-Task-Hub monorepo

This directory contains essential source code for configuration, testing infrastructure, and development utilities that support the entire monorepo ecosystem.

## Table of Contents
- [Overview](#overview)
- [Directory Structure](#directory-structure)
- [Configuration](#configuration)
- [Testing Infrastructure](#testing-infrastructure)
- [Mock Services](#mock-services)
- [Development](#development)

## Overview

### Purpose
- **Configuration Management** - Centralized app and development configuration
- **Testing Setup** - Global test configuration and utilities
- **Mock Services** - Development and testing mock implementations
- **Development Utilities** - Shared development tools and helpers

### Key Components
- **AI Configuration** - Advanced AI settings and model configurations
- **Audit Configuration** - Security and compliance settings
- **Global Test Setup** - Vitest configuration and test utilities
- **Browser Mocks** - Mock implementations for browser APIs

## Directory Structure

```
src/
├── config/
│   ├── ai-advanced.ts      # Advanced AI configuration
│   ├── ai.ts              # Basic AI settings
│   └── audit.ts           # Security audit configuration
├── mocks/
│   ├── browser.ts          # Browser API mocks
│   ├── handlers.ts         # Mock request handlers
│   └── server.ts          # Mock server setup
├── test/
│   ├── global-setup.ts     # Global test configuration
│   └── setup.ts           # Test environment setup
└── README.md              # This file
```

## Configuration

### AI Configuration

#### Basic AI Settings (`config/ai.ts`)
```typescript
export const aiConfig = {
  // OpenAI Configuration
  openai: {
    apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
    baseUrl: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL || 'https://api.openai.com/v1',
    defaultModel: process.env.AI_INTEGRATIONS_OPENAI_CHAT_MODEL || 'gpt-4',
    maxTokens: parseInt(process.env.AI_INTEGRATIONS_OPENAI_MAX_TOKENS || '4096'),
    temperature: parseFloat(process.env.AI_INTEGRATIONS_OPENAI_TEMPERATURE || '0.7'),
    timeout: parseInt(process.env.AI_INTEGRATIONS_OPENAI_TIMEOUT_MS || '30000'),
  },
  
  // Feature Flags
  features: {
    streaming: process.env.AI_INTEGRATIONS_OPENAI_ENABLE_STREAMING === 'true',
    images: process.env.AI_INTEGRATIONS_OPENAI_ENABLE_IMAGES === 'true',
    audio: process.env.AI_INTEGRATIONS_OPENAI_ENABLE_AUDIO === 'true',
  },
  
  // Rate Limiting
  rateLimit: {
    requestsPerMinute: parseInt(process.env.AI_INTEGRATIONS_OPENAI_RATE_LIMIT_RPM || '60'),
    tokensPerMinute: parseInt(process.env.AI_INTEGRATIONS_OPENAI_RATE_LIMIT_TPM || '100000'),
  },
};
```

#### Advanced AI Configuration (`config/ai-advanced.ts`)
```typescript
export const advancedAiConfig = {
  // Model Selection Strategy
  modelSelection: {
    strategy: 'cost-optimized', // 'cost-optimized' | 'performance-optimized' | 'balanced'
    fallbackModels: ['gpt-3.5-turbo', 'gpt-4'],
    modelCapabilities: {
      'gpt-4': ['chat', 'analysis', 'reasoning'],
      'gpt-3.5-turbo': ['chat', 'basic-analysis'],
    },
  },
  
  // Caching Strategy
  caching: {
    enabled: true,
    ttl: 3600, // 1 hour
    maxSize: 1000, // Maximum cached responses
    keyGenerator: (prompt: string, model: string) => 
      `${model}:${Buffer.from(prompt).toString('base64').slice(0, 32)}`,
  },
  
  // Performance Optimization
  performance: {
    batchRequests: true,
    maxBatchSize: 10,
    batchTimeout: 5000, // 5 seconds
    requestTimeout: 60000, // 60 seconds
  },
  
  // Monitoring
  monitoring: {
    trackTokens: true,
    trackLatency: true,
    trackErrors: true,
    sampleRate: 0.1, // Sample 10% of requests
  },
};
```

### Audit Configuration (`config/audit.ts`)
```typescript
export const auditConfig = {
  // Security Settings
  security: {
    enableAuditLogging: process.env.AUDIT_ENABLE_LOGGING === 'true',
    logLevel: process.env.AUDIT_LOG_LEVEL || 'info',
    retentionDays: parseInt(process.env.AUDIT_RETENTION_DAYS || '90'),
    sensitiveFields: ['password', 'apiKey', 'token', 'secret'],
  },
  
  // Compliance Settings
  compliance: {
    gdpr: {
      enabled: true,
      dataRetentionDays: 365,
      anonymizationEnabled: true,
    },
    soc2: {
      enabled: process.env.SOC2_ENABLED === 'true',
      auditTrail: true,
      accessLogging: true,
    },
  },
  
  // Monitoring
  monitoring: {
    alertThresholds: {
      failedLogins: 5,
      suspiciousActivity: 10,
      dataAccessAnomalies: 3,
    },
    notificationChannels: ['email', 'slack'],
  },
};
```

## Testing Infrastructure

### Global Test Setup (`test/global-setup.ts`)
```typescript
import { beforeAll, afterAll } from 'vitest';
import { setupMocks } from '../mocks/server';

// Global test configuration
beforeAll(async () => {
  // Setup test environment
  process.env.NODE_ENV = 'test';
  
  // Initialize mock servers
  await setupMocks();
  
  // Configure test database
  await setupTestDatabase();
  
  // Setup test logging
  setupTestLogging();
});

afterAll(async () => {
  // Cleanup test environment
  await cleanupMocks();
  await cleanupTestDatabase();
});
```

### Test Environment Setup (`test/setup.ts`)
```typescript
import { vi } from 'vitest';
import '@testing-library/jest-dom';

// Mock environment setup
vi.mock('next/router', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}));

// Global test utilities
global.testUtils = {
  createMockUser: () => ({
    id: 'test-user-id',
    email: 'test@example.com',
    name: 'Test User',
  }),
  
  createMockConversation: () => ({
    id: 'test-conversation-id',
    userId: 'test-user-id',
    title: 'Test Conversation',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }),
};
```

## Mock Services

### Browser Mocks (`mocks/browser.ts`)
```typescript
import { vi } from 'vitest';

// AudioWorklet Mock
export class MockAudioWorklet {
  constructor() {
    this.port = {
      postMessage: vi.fn(),
      start: vi.fn(),
      close: vi.fn(),
    };
  }
  
  static addModule = vi.fn();
  static terminate = vi.fn();
}

// Web Audio API Mocks
export const mockAudioContext = {
  createMediaStreamSource: vi.fn(),
  createAnalyser: vi.fn(),
  createGain: vi.fn(),
  createScriptProcessor: vi.fn(),
  decodeAudioData: vi.fn(),
};

// Geolocation Mock
export const mockGeolocation = {
  getCurrentPosition: vi.fn((success) => {
    success({
      coords: {
        latitude: 37.7749,
        longitude: -122.4194,
        accuracy: 10,
      },
    });
  }),
  watchPosition: vi.fn(),
  clearWatch: vi.fn(),
};
```

### Request Handlers (`mocks/handlers.ts`)
```typescript
import { rest } from 'msw';

// OpenAI API Mocks
export const openaiHandlers = [
  rest.post('https://api.openai.com/v1/chat/completions', (req, res, ctx) => {
    const { messages, model } = req.body;
    
    if (model === 'gpt-4') {
      return res(
        ctx.status(200),
        ctx.json({
          id: 'chatcmpl-test',
          object: 'chat.completion',
          created: Date.now(),
          model: 'gpt-4',
          choices: [{
            index: 0,
            message: {
              role: 'assistant',
              content: 'Mock response from GPT-4',
            },
            finish_reason: 'stop',
          }],
          usage: {
            prompt_tokens: 10,
            completion_tokens: 15,
            total_tokens: 25,
          },
        })
      );
    }
  }),
  
  rest.post('https://api.openai.com/v1/images/generations', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        created: Date.now(),
        data: [{
          url: 'https://mock-image-url.com/image.png',
          revised_prompt: req.body.prompt,
        }],
      })
    );
  }),
];

// Database API Mocks
export const databaseHandlers = [
  rest.get('/api/conversations', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        data: [
          {
            id: 'conv-1',
            title: 'Test Conversation 1',
            createdAt: '2026-03-30T17:00:00.000Z',
          },
          {
            id: 'conv-2',
            title: 'Test Conversation 2',
            createdAt: '2026-03-30T16:00:00.000Z',
          },
        ],
      })
    );
  }),
];
```

### Mock Server Setup (`mocks/server.ts`)
```typescript
import { setupServer } from 'msw';
import { openaiHandlers, databaseHandlers } from './handlers';

// Mock server configuration
export const server = setupServer(...openaiHandlers, ...databaseHandlers);

// Server setup utilities
export async function setupMocks() {
  // Start mock server for Node.js environment
  server.listen({
    onUnhandledRequest: 'warn',
  });
  
  // Setup browser mocks
  setupBrowserMocks();
}

export async function cleanupMocks() {
  server.close();
  cleanupBrowserMocks();
}

function setupBrowserMocks() {
  // Setup AudioWorklet mock
  global.AudioWorklet = MockAudioWorklet;
  global.AudioContext = vi.fn(() => mockAudioContext);
  global.navigator.geolocation = mockGeolocation;
}

function cleanupBrowserMocks() {
  // Cleanup browser mocks
  delete global.AudioWorklet;
  delete global.AudioContext;
  delete global.navigator.geolocation;
}
```

## Development

### Environment Setup

#### Development Environment Variables
```bash
# AI Configuration
AI_INTEGRATIONS_OPENAI_API_KEY=your-api-key
AI_INTEGRATIONS_OPENAI_CHAT_MODEL=gpt-4
AI_INTEGRATIONS_OPENAI_ENABLE_STREAMING=true

# Audit Configuration
AUDIT_ENABLE_LOGGING=true
AUDIT_LOG_LEVEL=info
AUDIT_RETENTION_DAYS=90

# Testing Configuration
NODE_ENV=test
TEST_DATABASE_URL=postgresql://test:test@localhost:5432/test_db
```

#### Development Scripts
```bash
# Start development with mocks
pnpm dev:mock

# Run tests with coverage
pnpm test:coverage

# Run integration tests
pnpm test:integration

# Run E2E tests
pnpm test:e2e
```

### Configuration Management

#### Environment-Specific Configs
```typescript
// config/index.ts
import { aiConfig } from './ai';
import { advancedAiConfig } from './ai-advanced';
import { auditConfig } from './audit';

const isDevelopment = process.env.NODE_ENV === 'development';
const isTest = process.env.NODE_ENV === 'test';
const isProduction = process.env.NODE_ENV === 'production';

export const config = {
  ai: {
    ...aiConfig,
    ...(isDevelopment && advancedAiConfig),
    ...(isTest && {
      ...advancedAiConfig,
      caching: { enabled: false }, // Disable caching in tests
    }),
  },
  audit: {
    ...auditConfig,
    ...(isTest && {
      security: {
        ...auditConfig.security,
        enableAuditLogging: false, // Disable audit logging in tests
      },
    }),
  },
  environment: {
    isDevelopment,
    isTest,
    isProduction,
  },
};
```

#### Configuration Validation
```typescript
// config/validation.ts
import { z } from 'zod';
import { config } from './index';

const configSchema = z.object({
  ai: z.object({
    openai: z.object({
      apiKey: z.string().min(1),
      baseUrl: z.url().optional(),
      defaultModel: z.string(),
      maxTokens: z.number().min(1),
      temperature: z.number().min(0).max(2),
    }),
    features: z.object({
      streaming: z.boolean(),
      images: z.boolean(),
      audio: z.boolean(),
    }),
  }),
  audit: z.object({
    security: z.object({
      enableAuditLogging: z.boolean(),
      logLevel: z.enum(['debug', 'info', 'warn', 'error']),
      retentionDays: z.number().min(1),
    }),
  }),
});

export function validateConfig() {
  const result = configSchema.safeParse(config);
  
  if (!result.success) {
    console.error('Configuration validation failed:', result.error);
    throw new Error('Invalid configuration');
  }
  
  return result.data;
}
```

### Testing Utilities

#### Custom Test Matchers
```typescript
// test/matchers.ts
import { expect } from 'vitest';
import { z } from 'zod';

// Custom matcher for Zod schemas
expect.extend({
  toMatchZodSchema(received: unknown, schema: z.ZodType) {
    const result = schema.safeParse(received);
    
    if (result.success) {
      return {
        message: () => `expected ${received} not to match schema`,
        pass: true,
      };
    } else {
      return {
        message: () => 
          `expected ${received} to match schema, but got errors: ${JSON.stringify(result.error.issues, null, 2)}`,
        pass: false,
      };
    }
  },
});

// Usage in tests
expect(userInput).toMatchZodSchema(userSchema);
```

#### Test Data Factories
```typescript
// test/factories.ts
import { faker } from '@faker-js/faker';

export const createTestUser = (overrides = {}) => ({
  id: faker.string.uuid(),
  email: faker.internet.email(),
  name: faker.person.fullName(),
  createdAt: faker.date.past().toISOString(),
  ...overrides,
});

export const createTestConversation = (overrides = {}) => ({
  id: faker.string.uuid(),
  userId: faker.string.uuid(),
  title: faker.lorem.sentence(),
  createdAt: faker.date.past().toISOString(),
  updatedAt: faker.date.recent().toISOString(),
  ...overrides,
});

export const createTestMessage = (overrides = {}) => ({
  id: faker.string.uuid(),
  conversationId: faker.string.uuid(),
  role: faker.helpers.arrayElement(['user', 'assistant']),
  content: faker.lorem.paragraph(),
  createdAt: faker.date.recent().toISOString(),
  ...overrides,
});
```

## Best Practices

### Configuration Management
- **Environment Variables** - Use environment variables for all external configuration
- **Validation** - Validate all configuration at startup
- **Type Safety** - Use TypeScript for all configuration objects
- **Documentation** - Document all configuration options and their effects

### Testing Infrastructure
- **Isolation** - Ensure tests are isolated and don't interfere
- **Realistic Mocks** - Mocks should behave like real services
- **Cleanup** - Properly cleanup resources after tests
- **Coverage** - Maintain high test coverage for critical paths

### Mock Services
- **Consistency** - Mocks should match real API contracts
- **Error Scenarios** - Test both success and error scenarios
- **Performance** - Mocks should be fast and reliable
- **Maintainability** - Keep mocks in sync with real implementations

## Dependencies

### Runtime Dependencies
- No runtime dependencies - this is source code only

### Development Dependencies
- `vitest` - Testing framework
- `msw` - Mock Service Worker
- `@testing-library/jest-dom` - Testing utilities
- `@faker-js/faker` - Test data generation

## Related Components

- **Configuration** - Used by all applications and libraries
- **Testing** - Used across the monorepo for consistent testing
- **Mock Services** - Used by development and test environments

## Support

For source code issues:
- Check the main [README.md](../README.md)
- Review specific package documentation
- Submit [GitHub Issues](https://github.com/TrevorPLam/Intelli-Task-Hub/issues)

## License

MIT License - see the main project [LICENSE](../LICENSE) file for details.
