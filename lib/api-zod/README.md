# @workspace/api-zod
> Generated Zod validation schemas from OpenAPI specification for runtime type safety

Auto-generated Zod schemas providing runtime validation for all API data structures. Generated from OpenAPI specification using Orval with Zod target configuration.

## Table of Contents
- [Overview](#overview)
- [Generated Schemas](#generated-schemas)
- [Usage](#usage)
- [Validation](#validation)
- [Development](#development)

## Overview

### Purpose
- **Runtime Validation** - Type-safe data validation at runtime
- **API Contract Enforcement** - Ensure data matches OpenAPI specification
- **Error Handling** - Detailed validation error messages
- **Type Inference** - Generate TypeScript types from schemas

### Generation Process
```
OpenAPI Specification (api-spec/openapi.yaml)
                    ↓
              Orval Codegen
                    ↓
┌─────────────────┬─────────────────┐
│   Zod Schemas   │ TypeScript Types │
│   (Validation)   │   (Inference)   │
└─────────────────┴─────────────────┘
```

## Generated Schemas

### Core Data Models

#### Conversation Schema
```typescript
import { z } from 'zod';

export const conversationSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  title: z.string().min(1).max(200),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type Conversation = z.infer<typeof conversationSchema>;
```

#### Message Schema
```typescript
export const messageSchema = z.object({
  id: z.string().uuid(),
  conversationId: z.string().uuid(),
  role: z.enum(['user', 'assistant', 'system']),
  content: z.string().min(1).max(4000),
  createdAt: z.string().datetime(),
});

export type Message = z.infer<typeof messageSchema>;
```

#### User Schema
```typescript
export const userSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string().min(1).max(100),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type User = z.infer<typeof userSchema>;
```

### Request/Response Schemas

#### Create Conversation Request
```typescript
export const createConversationRequestSchema = z.object({
  title: z.string().min(1).max(200),
  userId: z.string().uuid(),
});

export type CreateConversationRequest = z.infer<typeof createConversationRequestSchema>;
```

#### OpenAI Conversation Request
```typescript
export const openaiConversationRequestSchema = z.object({
  message: z.string().min(1).max(4000),
  conversationId: z.string().uuid().optional(),
  stream: z.boolean().default(false),
});

export type OpenaiConversationRequest = z.infer<typeof openaiConversationRequestSchema>;
```

#### API Response Wrapper
```typescript
export const apiResponseSchema = <T>(dataSchema: z.ZodType<T>) => 
  z.object({
    data: dataSchema,
    message: z.string(),
    success: z.boolean(),
  });

export type ApiResponse<T> = z.infer<ReturnType<typeof apiResponseSchema<T>>>;
```

### Error Schemas
```typescript
export const apiErrorSchema = z.object({
  message: z.string(),
  code: z.string(),
  status: z.number(),
  details: z.unknown().optional(),
});

export type ApiError = z.infer<typeof apiErrorSchema>;
```

## Usage

### Basic Validation
```typescript
import { conversationSchema, type Conversation } from '@workspace/api-zod';

// Validate incoming data
function validateConversation(data: unknown): Conversation {
  const result = conversationSchema.safeParse(data);
  
  if (!result.success) {
    console.error('Validation failed:', result.error);
    throw new Error('Invalid conversation data');
  }
  
  return result.data;
}

// Usage
const validConversation = validateConversation({
  id: '550e8400-e29b-41d4-a716-446655440000',
  userId: '550e8400-e29b-41d4-a716-446655440001',
  title: 'Test Conversation',
  createdAt: '2026-03-30T17:00:00.000Z',
  updatedAt: '2026-03-30T17:00:00.000Z',
});
```

### API Response Validation
```typescript
import { 
  apiResponseSchema, 
  conversationSchema,
  type Conversation 
} from '@workspace/api-zod';

// Type-safe API response handling
function handleApiResponse(response: unknown): Conversation[] {
  const responseSchema = apiResponseSchema(z.array(conversationSchema));
  const result = responseSchema.safeParse(response);
  
  if (!result.success) {
    throw new Error(`Invalid API response: ${result.error.message}`);
  }
  
  return result.data.data;
}
```

### Form Validation
```typescript
import { createConversationRequestSchema } from '@workspace/api-zod';

// React form validation
function validateConversationForm(formData: FormData) {
  const data = {
    title: formData.get('title'),
    userId: formData.get('userId'),
  };
  
  const result = createConversationRequestSchema.safeParse(data);
  
  if (!result.success) {
    return {
      isValid: false,
      errors: result.error.issues.map(issue => ({
        field: issue.path.join('.'),
        message: issue.message,
      })),
    };
  }
  
  return {
    isValid: true,
    data: result.data,
  };
}
```

### Custom Validation Rules
```typescript
import { z } from 'zod';

// Extend generated schemas with custom validation
const extendedConversationSchema = conversationSchema.extend({
  title: z.string()
    .min(1, 'Title is required')
    .max(200, 'Title must be less than 200 characters')
    .regex(/^[a-zA-Z0-9\s]+$/, 'Title can only contain letters, numbers, and spaces'),
});

// Conditional validation
const conditionalSchema = z.object({
  type: z.enum(['user', 'admin']),
  permissions: z.array(z.string()).optional(),
}).refine((data) => {
  if (data.type === 'admin' && (!data.permissions || data.permissions.length === 0)) {
    return false;
  }
  return true;
}, {
  message: 'Admin users must have at least one permission',
  path: ['permissions'],
});
```

## Validation

### Error Handling
```typescript
import { ZodError } from 'zod';

function handleValidationError(error: unknown) {
  if (error instanceof ZodError) {
    console.error('Zod validation error:', {
      issues: error.issues,
      message: error.message,
    });
    
    // Format user-friendly error messages
    const formattedErrors = error.issues.map(issue => ({
      field: issue.path.join('.'),
      message: getErrorMessage(issue),
    }));
    
    return formattedErrors;
  }
  
  // Handle other error types
  return [{ field: 'unknown', message: 'Validation failed' }];
}

function getErrorMessage(issue: z.ZodIssue): string {
  switch (issue.code) {
    case 'too_small':
      return `${issue.path?.join('.')} is too short`;
    case 'too_big':
      return `${issue.path?.join('.')} is too long`;
    case 'invalid_string':
      return `${issue.path?.join('.')} must be a string`;
    case 'invalid_type':
      return `${issue.path?.join('.')} must be of type ${issue.expected}`;
    default:
      return issue.message || 'Invalid value';
  }
}
```

### Validation Middleware
```typescript
import { Request, Response, NextFunction } from 'express';
import { openaiConversationRequestSchema } from '@workspace/api-zod';

// Express middleware for request validation
export function validateRequestBody(schema: z.ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    
    if (!result.success) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: result.error.issues,
      });
    }
    
    req.body = result.data;
    next();
  };
}

// Usage in API routes
app.post('/api/openai/conversations', 
  validateRequestBody(openaiConversationRequestSchema),
  (req, res) => {
    // req.body is now typed and validated
    res.json({ message: 'Request validated successfully' });
  }
);
```

### Client-Side Validation
```typescript
// React Hook for form validation
import { useState } from 'react';
import { createConversationRequestSchema } from '@workspace/api-zod';

export function useValidation<T>(schema: z.ZodSchema<T>) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isValid, setIsValid] = useState(false);

  const validate = (data: unknown): data is T => {
    const result = schema.safeParse(data);
    
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach(issue => {
        const field = issue.path?.join('.') || 'unknown';
        fieldErrors[field] = issue.message;
      });
      
      setErrors(fieldErrors);
      setIsValid(false);
      return false;
    }
    
    setErrors({});
    setIsValid(true);
    return true;
  };

  return { validate, errors, isValid };
}
```

## Development

### Schema Regeneration
```bash
# Navigate to api-spec package
cd ../api-spec

# Regenerate Zod schemas
pnpm run codegen

# Return to this package
cd -

# Build generated types
pnpm build
```

### File Structure
```
src/
├── generated/
│   └── types/
│       ├── conversation.ts      # Conversation schemas
│       ├── message.ts          # Message schemas
│       ├── user.ts             # User schemas
│       ├── openai.ts           # OpenAI request schemas
│       ├── createOpenaiConversationBody.ts
│       ├── createOpenaiImageBody.ts
│       ├── createOpenaiImageBodySize.ts
│       ├── generateOpenaiImageResponse.ts
│       └── index.ts            # Main exports
└── index.ts                    # Package exports
```

### Custom Schema Extensions
```typescript
// src/custom-schemas.ts
import { z } from 'zod';
import { conversationSchema } from './generated/types/conversation';

// Extend base schema with additional validation
const enhancedConversationSchema = conversationSchema.extend({
  category: z.enum(['work', 'personal', 'project']).default('personal'),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
  tags: z.array(z.string().max(50)).default([]),
});

export { enhancedConversationSchema };
```

### Testing Generated Schemas
```typescript
// __tests__/schemas.test.ts
import { conversationSchema } from '../src/generated/types/conversation';
import { z } from 'zod';

describe('Generated Schemas', () => {
  describe('conversationSchema', () => {
    it('should validate valid conversation data', () => {
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

    it('should reject invalid UUID', () => {
      const invalidData = {
        id: 'invalid-uuid',
        userId: '550e8400-e29b-41d4-a716-446655440001',
        title: 'Test Conversation',
        createdAt: '2026-03-30T17:00:00.000Z',
        updatedAt: '2026-03-30T17:00:00.000Z',
      };

      const result = conversationSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      expect(result.error.issues).toHaveLength(1);
      expect(result.error.issues[0].code).toBe('invalid_string');
    });

    it('should reject title that is too long', () => {
      const invalidData = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        userId: '550e8400-e29b-41d4-a716-446655440001',
        title: 'a'.repeat(201), // 201 characters (exceeds 200)
        createdAt: '2026-03-30T17:00:00.000Z',
        updatedAt: '2026-03-30T17:00:00.000Z',
      };

      const result = conversationSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      expect(result.error.issues[0].code).toBe('too_big');
    });
  });
});
```

## Best Practices

### Schema Design
- **Specific Types** - Use specific string formats (email, uuid, datetime)
- **Proper Constraints** - Define min/max lengths and patterns
- **Optional Fields** - Mark truly optional fields with .optional()
- **Default Values** - Provide sensible defaults where appropriate

### Validation Performance
- **Early Returns** - Fail fast on invalid data
- **Selective Validation** - Validate only what's needed
- **Caching** - Cache compiled schemas for reuse

### Error Handling
- **User-Friendly Messages** - Provide clear error messages
- **Field-Specific Errors** - Indicate which field failed
- **Aggregated Errors** - Return all validation errors at once

## Dependencies

### Runtime Dependencies
- `zod` - Schema validation and type inference

### Development Dependencies
- `typescript` - TypeScript compiler and type definitions

## Related Packages

- **[@workspace/api-spec](../api-spec/README.md)** - OpenAPI specification source
- **[@workspace/api-client-react](../api-client-react/README.md)** - Generated React Query hooks
- **[@workspace/api-server](../../artifacts/api-server/README.md)** - API implementation using these schemas

## Troubleshooting

### Common Issues

#### Type Mismatch
```bash
# Regenerate after API spec changes
pnpm --filter @workspace/api-spec run codegen
pnpm build
```

#### Import Errors
- Verify generated files exist in src/generated/types/
- Check index.ts exports
- Ensure proper TypeScript resolution

#### Validation Failures
- Check schema definitions match API specification
- Verify data structure before validation
- Use .safeParse() for graceful error handling

### Debug Mode
```typescript
// Enable detailed error logging
if (process.env.NODE_ENV === 'development') {
  console.log('Validation result:', result);
  console.log('Schema:', schema);
}
```

## Support

For schema validation issues:
- Check [Zod Documentation](https://zod.dev/)
- Review [Orval Documentation](https://orval.dev/)
- Submit [GitHub Issues](https://github.com/TrevorPLam/Intelli-Task-Hub/issues)

## License

MIT License - see the main project [LICENSE](../../../LICENSE) file for details.
