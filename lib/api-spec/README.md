# @workspace/api-spec
> OpenAPI 3.1 specification and Orval code generation configuration for Intelli-Task-Hub API

Central API specification defining the contract between frontend applications and backend services. Uses OpenAPI 3.1 standard with Orval for automatic client code generation.

## Table of Contents
- [Overview](#overview)
- [Specification](#specification)
- [Code Generation](#code-generation)
- [Configuration](#configuration)
- [Development](#development)

## Overview

### Purpose
- **API Contract** - Single source of truth for API structure
- **Code Generation** - Automatic client library generation
- **Documentation** - Interactive API documentation
- **Type Safety** - Generated TypeScript types and validation

### Technology Stack
- **Specification**: OpenAPI 3.1 (YAML format)
- **Code Generation**: Orval with custom templates
- **Validation**: Zod schema generation
- **Documentation**: OpenAPI-generated docs

## Specification

### API Structure
```yaml
# openapi.yaml structure
openapi: 3.1.0
info:
  title: Intelli-Task-Hub API
  version: 1.0.0
  description: AI-powered productivity platform API
servers:
  - url: https://api.intellitaskhub.com
    description: Production server
  - url: https://dev-api.intellitaskhub.com
    description: Development server
```

### Endpoints Overview

#### Authentication
```yaml
/api/auth:
  login:
    post:
      summary: User authentication
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                email: { type: string, format: email }
                password: { type: string, minLength: 8 }
      responses:
        '200':
          description: Authentication successful
          content:
            application/json:
              schema:
                type: object
                properties:
                  token: { type: string }
                  user: { $ref: '#/components/schemas/User' }
```

#### Conversations
```yaml
/api/conversations:
  get:
    summary: List user conversations
    parameters:
      - name: limit
        in: query
        schema:
          type: integer
          default: 20
    responses:
        '200':
          description: List of conversations
          content:
            application/json:
              schema:
                type: object
                properties:
                  data:
                    type: array
                    items: { $ref: '#/components/schemas/Conversation' }
```

#### OpenAI Integration
```yaml
/api/openai:
  conversations:
    post:
      summary: Send message to OpenAI
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                message: { type: string, maxLength: 4000 }
                conversationId: { type: string, format: uuid }
                stream: { type: boolean, default: false }
      responses:
        '200':
          description: AI response
          content:
            application/json:
              schema:
                oneOf:
                  - type: object  # Streaming response
                    properties:
                      stream: { type: boolean }
                  - type: object  # Complete response
                    properties:
                      message: { type: string }
```

### Data Models

#### Conversation Schema
```yaml
components:
  schemas:
    Conversation:
      type: object
      required:
        - id
        - userId
        - title
        - createdAt
        - updatedAt
      properties:
        id:
          type: string
          format: uuid
          readOnly: true
        userId:
          type: string
          format: uuid
        title:
          type: string
          minLength: 1
          maxLength: 200
        createdAt:
          type: string
          format: date-time
          readOnly: true
        updatedAt:
          type: string
          format: date-time
          readOnly: true
```

#### Message Schema
```yaml
    Message:
      type: object
      required:
        - id
        - conversationId
        - role
        - content
        - createdAt
      properties:
        id:
          type: string
          format: uuid
          readOnly: true
        conversationId:
          type: string
          format: uuid
        role:
          type: string
          enum: [user, assistant, system]
        content:
          type: string
          maxLength: 4000
        createdAt:
          type: string
          format: date-time
          readOnly: true
```

## Code Generation

### Orval Configuration
```typescript
// orval.config.ts
import { defineConfig } from 'orval';

export default defineConfig({
  input: './openapi.yaml',
  output: {
    '../api-client-react/src': {
      mode: 'tags-split',
      target: 'react-query',
      client: 'axios',
      override: {
        mutator: {
          path: '../api-client-react/src/custom-fetch.ts',
          name: 'customFetch',
        },
        query: {
          useInfinite: true,
          useQuery: true,
        },
      },
    },
    '../api-zod/src': {
      mode: 'tags-split',
      target: 'zod',
      schemas: true,
    },
  },
  hooks: {
    afterAllFilesWrite: 'npm run build',
  },
});
```

### Generated Output Structure
```
Generated Files:
├── api-client-react/src/
│   ├── generated/
│   │   ├── api.ts              # React Query hooks
│   │   ├── api.schemas.ts     # TypeScript types
│   │   └── sse-parser.ts      # Server-sent events
│   ├── custom-fetch.ts          # Custom fetch implementation
│   └── index.ts               # Main exports
└── api-zod/src/
    └── generated/
        └── types/               # Zod validation schemas
```

### React Query Hooks Generation
```typescript
// Generated hook example
export const useConversations = <
  TData = Array<Conversation>,
  TError = unknown,
>(
  options?: Omit<
    UseQueryOptions<Array<Conversation>, TError>,
    'queryKey' | 'queryFn'
  >,
) => {
  return useQuery<Array<Conversation>, TError>({
    queryKey: ['conversations'],
    queryFn: async () => {
      const { data } = await api.get('/api/conversations');
      return data;
    },
    ...options,
  });
};
```

### Zod Schema Generation
```typescript
// Generated Zod schema
export const conversationSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  title: z.string().min(1).max(200),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type Conversation = z.infer<typeof conversationSchema>;
```

## Configuration

### Orval Configuration Options

```typescript
// orval.config.ts advanced options
export default defineConfig({
  input: './openapi.yaml',
  output: {
    '../api-client-react/src': {
      mode: 'tags-split',
      target: 'react-query',
      client: 'axios',
      override: {
        operations: {
          // Custom operation overrides
          createConversation: {
            mutator: {
              path: '../custom-mutator.ts',
              name: 'authenticatedFetch',
            },
          },
        },
        query: {
          // React Query configuration
          useInfinite: ['getConversations'], // Infinite queries for specific endpoints
          useQuery: true, // Enable query hooks
          useMutation: true, // Enable mutation hooks
          queryOptions: {
            staleTime: 5 * 60 * 1000, // 5 minutes
            cacheTime: 10 * 60 * 1000, // 10 minutes
            retry: 3,
          },
        },
      },
    },
  },
  // Custom plugins and hooks
  plugins: [
    '@orval/plugin-react-query',
    '@orval/plugin-zod',
  ],
  hooks: {
    // Lifecycle hooks
    beforeAllFilesWrite: 'echo "Starting generation..."',
    afterAllFilesWrite: 'npm run build && echo "Generation complete"',
  },
  // Validation
  validate: true,
});
```

### Multi-Environment Configuration
```typescript
// Environment-specific generation
const isDevelopment = process.env.NODE_ENV === 'development';

export default defineConfig({
  input: './openapi.yaml',
  output: {
    '../api-client-react/src': {
      mode: 'tags-split',
      target: 'react-query',
      client: 'axios',
      mock: isDevelopment, // Enable mocks in development
      override: {
        query: {
          queryOptions: {
            staleTime: isDevelopment ? 30 * 1000 : 5 * 60 * 1000,
            retry: isDevelopment ? 1 : 3,
          },
        },
      },
    },
  },
});
```

## Development

### Local Development Setup

```bash
# Install dependencies
pnpm install

# Validate OpenAPI spec
orval --config ./orval.config.ts --validate-only

# Generate code
pnpm run codegen

# Watch for changes (development)
pnpm run codegen:watch
```

### Specification Editing

#### OpenAPI Editor Tools
```bash
# Use Swagger Editor for visual editing
docker run -p 8080:8080 swaggerapi/swagger-editor

# Or use online editor
# https://editor.swagger.io/
```

#### Specification Validation
```bash
# Validate against OpenAPI 3.1 spec
npm install -g @apidevtools/swagger-parser
swagger-parser validate openapi.yaml

# Or use Orval validation
orval --config ./orval.config.ts --validate-only
```

### Code Generation Workflow

#### 1. Update Specification
```yaml
# openapi.yaml
paths:
  /api/new-endpoint:
    post:
      summary: New endpoint description
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/NewRequest'
      responses:
        '201':
          description: Resource created
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/NewResponse'
```

#### 2. Generate Code
```bash
# Generate updated clients
pnpm run codegen

# Build generated packages
pnpm --filter @workspace/api-client-react build
pnpm --filter @workspace/api-zod build
```

#### 3. Update Dependencies
```bash
# Update dependent packages
pnpm --filter @workspace/mobile build
pnpm --filter @workspace/api-server build
```

### Testing Generated Code

#### Unit Tests for Generated Types
```typescript
// __tests__/schemas.test.ts
import { conversationSchema } from '../src/generated/types/conversation';
import { z } from 'zod';

describe('Generated Schemas', () => {
  it('should validate conversation data', () => {
    const validData = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      userId: '550e8400-e29b-41d4-a716-446655440001',
      title: 'Test Conversation',
      createdAt: '2026-03-30T17:00:00.000Z',
      updatedAt: '2026-03-30T17:00:00.000Z',
    };

    const result = conversationSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it('should reject invalid conversation data', () => {
    const invalidData = {
      id: 'invalid-uuid',
      userId: '550e8400-e29b-41d4-a716-446655440001',
      title: '',
      createdAt: '2026-03-30T17:00:00.000Z',
      updatedAt: '2026-03-30T17:00:00.000Z',
    };

    const result = conversationSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });
});
```

#### Integration Tests for Generated Hooks
```typescript
// __tests__/hooks.test.tsx
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useConversations } from '../src/generated/api';

describe('Generated Hooks', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
  });

  it('should fetch conversations', async () => {
    const { result } = renderHook(() => useConversations(), {
      wrapper: ({ children }) => (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      ),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
      expect(result.current.data).toBeDefined();
    });
  });
});
```

## Best Practices

### Specification Design
- **Consistent Naming** - Use kebab-case for endpoint paths
- **Proper HTTP Methods** - GET (read), POST (create), PUT (update), DELETE (remove)
- **Status Codes** - Use appropriate HTTP status codes
- **Error Responses** - Consistent error response format
- **Documentation** - Clear descriptions and examples

### Schema Design
- **Reusable Components** - Use `$ref` for shared schemas
- **Validation Rules** - Define constraints in schemas
- **Type Safety** - Strong typing with formats
- **Versioning** - Include version information

### Code Generation
- **Custom Templates** - Override default templates when needed
- **Environment-Specific** - Different configs for dev/prod
- **Validation** - Always validate generated code
- **Documentation** - Document custom overrides

## Dependencies

### Development Dependencies
- `orval` - OpenAPI code generation tool
- `typescript` - TypeScript compiler

### Generated Output Dependencies
- `@tanstack/react-query` - React Query hooks
- `axios` - HTTP client (generated)
- `zod` - Schema validation (generated)

## Related Packages

- **[@workspace/api-client-react](../api-client-react/README.md)** - Generated React Query hooks
- **[@workspace/api-zod](../api-zod/README.md)** - Generated Zod schemas
- **[@workspace/api-server](../../artifacts/api-server/README.md)** - API implementation

## Troubleshooting

### Common Issues

#### Generation Errors
```bash
# Check OpenAPI syntax
orval --config ./orval.config.ts --validate-only

# Common syntax issues:
# - Missing required fields
# - Invalid reference paths
# - Incorrect HTTP method usage
```

#### Type Errors
```bash
# Regenerate after spec changes
pnpm run codegen

# Check TypeScript compilation
pnpm --filter @workspace/api-client-react typecheck
```

#### Import Errors
- Verify output paths in orval.config.ts
- Check package.json exports
- Ensure proper TypeScript resolution

### Debug Mode
```bash
# Verbose generation output
DEBUG=orval:* pnpm run codegen

# Generate with additional logging
orval --config ./orval.config.ts --verbose
```

## Support

For API specification issues:
- Check [OpenAPI Specification](https://swagger.io/specification/)
- Review [Orval Documentation](https://orval.dev/)
- Submit [GitHub Issues](https://github.com/TrevorPLam/Intelli-Task-Hub/issues)

## License

MIT License - see the main project [LICENSE](../../../LICENSE) file for details.
