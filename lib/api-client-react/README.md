# @workspace/api-client-react
> Generated React Query hooks for type-safe API communication with Intelli-Task-Hub backend

Auto-generated React Query hooks and TypeScript types providing type-safe API communication with the Intelli-Task-Hub API server. Generated from OpenAPI specification using Orval code generation.

## Table of Contents
- [Overview](#overview)
- [Installation](#installation)
- [Usage](#usage)
- [Generated Hooks](#generated-hooks)
- [Type Safety](#type-safety)
- [Development](#development)

## Overview

### Features
- **Auto-Generated** - Built from OpenAPI specification
- **Type-Safe** - Full TypeScript support with generated types
- **React Query Integration** - Caching, refetching, and state management
- **Error Handling** - Built-in error handling and retry logic
- **SSR Support** - Server-side rendering compatible

### Generation Process
```
OpenAPI Spec (api-spec/openapi.yaml)
           ↓
      Orval Codegen
           ↓
┌─────────────────┬─────────────────┐
│ React Hooks   │ TypeScript Types │
│ (React Query) │   (Zod)       │
└─────────────────┴─────────────────┘
```

## Installation

### Prerequisites
- React 18+ application
- Node.js 24+
- pnpm package manager

### Setup Commands

```bash
# Install the package
pnpm add @workspace/api-client-react

# Install peer dependencies
pnpm add react @tanstack/react-query
```

### Provider Setup

```tsx
// App.tsx or root component
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
    mutations: {
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <YourApp />
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
```

## Usage

### Basic Usage

```tsx
import { 
  useConversations,
  useCreateConversation,
  type Conversation 
} from '@workspace/api-client-react';

function ConversationList() {
  const { 
    data: conversations, 
    isLoading, 
    error 
  } = useConversations();

  const createMutation = useCreateConversation();

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      {conversations?.map((conversation: Conversation) => (
        <div key={conversation.id}>
          <h3>{conversation.title}</h3>
          <p>{conversation.createdAt}</p>
        </div>
      ))}
      
      <button 
        onClick={() => createMutation.mutate({
          title: 'New Conversation',
          userId: 'user-id'
        })}
        disabled={createMutation.isPending}
      >
        Create Conversation
      </button>
    </div>
  );
}
```

### Advanced Usage

#### Custom Hooks
```tsx
import { useApi } from '@workspace/api-client-react';

function CustomComponent() {
  const api = useApi();

  const handleCustomRequest = async () => {
    try {
      const response = await api.get('/api/custom-endpoint');
      console.log(response.data);
    } catch (error) {
      console.error('API Error:', error);
    }
  };

  return <button onClick={handleCustomRequest}>Custom Request</button>;
}
```

#### Query Options
```tsx
import { useConversations } from '@workspace/api-client-react';

function OptimizedConversationList() {
  const { data, isLoading } = useConversations({
    query: {
      enabled: true, // Enable/disable query
      staleTime: 10 * 60 * 1000, // 10 minutes
      refetchOnWindowFocus: true,
      retry: (failureCount, error) => {
        // Custom retry logic
        if (error.status === 404) return false;
        return failureCount < 3;
      },
    },
  });

  // ... component logic
}
```

## Generated Hooks

### Conversation Hooks

#### `useConversations`
```tsx
const { data, isLoading, error, refetch } = useConversations();
```
Fetches all conversations for the current user.

#### `useConversation`
```tsx
const { data, isLoading, error } = useConversation({ id: 'conversation-id' });
```
Fetches a specific conversation by ID.

#### `useCreateConversation`
```tsx
const mutation = useCreateConversation();

mutation.mutate({
  title: 'New Conversation',
  userId: 'user-id'
});
```
Creates a new conversation.

### Message Hooks

#### `useMessages`
```tsx
const { data, isLoading, error } = useMessages({ conversationId: 'conv-id' });
```
Fetches messages for a specific conversation.

#### `useCreateMessage`
```tsx
const mutation = useCreateMessage();

mutation.mutate({
  conversationId: 'conv-id',
  role: 'user',
  content: 'Hello, AI!'
});
```

### OpenAI Hooks

#### `useOpenaiConversation`
```tsx
const mutation = useOpenaiConversation();

mutation.mutate({
  message: 'Hello, how can you help?',
  conversationId: 'optional-existing-id'
});
```
Sends a message to OpenAI for processing.

#### `useGenerateOpenaiImage`
```tsx
const mutation = useGenerateOpenaiImage();

mutation.mutate({
  prompt: 'A beautiful sunset',
  size: '1024x1024'
});
```
Generates an image using OpenAI DALL-E.

### Utility Hooks

#### `useApi`
```tsx
const api = useApi();
```
Returns the configured API client for custom requests.

#### `useApiError`
```tsx
const error = useApiError();
```
Utility hook for handling API errors consistently.

## Type Safety

### Generated Types

```typescript
// Auto-generated from OpenAPI spec
export interface Conversation {
  id: string;
  userId: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateConversationRequest {
  title: string;
  userId: string;
}

export interface ApiResponse<T> {
  data: T;
  message: string;
  success: boolean;
}
```

### Zod Validation
```typescript
import { z } from 'zod';
import { conversationSchema } from '@workspace/api-client-react';

// Runtime validation
const result = conversationSchema.safeParse(data);
if (!result.success) {
  console.error('Validation error:', result.error);
}
```

### Error Types

```typescript
export interface ApiError {
  message: string;
  status: number;
  code: string;
  details?: unknown;
}

// Usage in components
const { error } = useConversations();
if (error) {
  console.log('Error status:', error.status);
  console.log('Error code:', error.code);
}
```

## Development

### Code Generation

#### Regenerating Hooks
```bash
# Navigate to api-spec package
cd ../api-spec

# Regenerate API client
pnpm run codegen

# Return to this package
cd -

# Build generated types
pnpm build
```

#### File Structure
```
src/
├── generated/
│   ├── api.ts              # React Query hooks
│   ├── api.schemas.ts     # TypeScript types
│   └── sse-parser.ts      # Server-sent events parser
├── custom-fetch.ts         # Custom fetch implementation
├── index.ts              # Main exports
└── types.ts              # Additional type definitions
```

### Custom Configuration

#### Base URL Configuration
```tsx
import { ApiProvider } from '@workspace/api-client-react';

function App() {
  return (
    <ApiProvider 
      baseUrl="https://your-api-server.com"
      headers={{
        'Authorization': 'Bearer your-token'
      }}
    >
      <YourApp />
    </ApiProvider>
  );
}
```

#### Custom Fetch Implementation
```typescript
// custom-fetch.ts
export const customFetch = async (url: string, options: RequestInit) => {
  // Add authentication headers
  const headers = {
    ...options.headers,
    'Authorization': `Bearer ${getToken()}`,
    'Content-Type': 'application/json',
  };

  // Custom error handling
  try {
    const response = await fetch(url, { ...options, headers });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    return response;
  } catch (error) {
    console.error('API Request failed:', error);
    throw error;
  }
};
```

### Testing

#### Mock API for Testing
```tsx
// __tests__/mocks/api.ts
import { rest } from 'msw';
import { setupServer } from 'msw/node';

export const apiServer = setupServer(
  rest.get('/api/conversations', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        data: [
          { id: '1', title: 'Test Conversation' },
          { id: '2', title: 'Another Conversation' }
        ]
      })
    );
  }),
  
  rest.post('/api/conversations', (req, res, ctx) => {
    return res(
      ctx.status(201),
      ctx.json({
        data: { id: 'new-id', ...req.body }
      })
    );
  })
);
```

#### Component Testing
```tsx
// __tests__/ConversationList.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ConversationList } from '../ConversationList';

const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
});

test('renders conversation list', async () => {
  const queryClient = createTestQueryClient();
  
  render(
    <QueryClientProvider client={queryClient}>
      <ConversationList />
    </QueryClientProvider>
  );

  await waitFor(() => {
    expect(screen.getByText('Test Conversation')).toBeInTheDocument();
  });
});
```

## Performance Optimization

### Query Optimization
```tsx
// Enable selective fetching
const { data } = useConversations({
  query: {
    select: (conversations) => 
      conversations.map(conv => ({
        id: conv.id,
        title: conv.title
        // Only select needed fields
      }))
  }
});
```

### Caching Strategy
```tsx
// Configure intelligent caching
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      refetchOnMount: false,
      refetchOnWindowFocus: false,
    },
  },
});
```

### Memory Management
```tsx
// Cleanup queries on unmount
useEffect(() => {
  return () => {
    queryClient.removeQueries(['conversations']);
  };
}, []);
```

## Dependencies

### Runtime Dependencies
- `@tanstack/react-query` - Server state management
- `react` - React framework (peer dependency)

### Development Dependencies
- `@types/react` - React TypeScript definitions
- `typescript` - TypeScript compiler

## Related Packages

- **[@workspace/api-spec](../api-spec/README.md)** - OpenAPI specification source
- **[@workspace/api-zod](../api-zod/README.md)** - Zod validation schemas
- **[@workspace/api-server](../../artifacts/api-server/README.md)** - Backend API implementation

## Troubleshooting

### Common Issues

#### Type Errors
```bash
# Regenerate types if API spec changed
pnpm --filter @workspace/api-spec run codegen
pnpm build
```

#### Query Not Updating
```tsx
// Force refetch
const { refetch } = useConversations();
refetch();

// Or invalidate cache
queryClient.invalidateQueries(['conversations']);
```

#### Network Errors
- Check API server connectivity
- Verify authentication tokens
- Validate request payloads

### Debug Mode
```tsx
// Enable React Query devtools
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

<ReactQueryDevtools initialIsOpen={true} />
```

## Support

For API client issues:
- Check [React Query Documentation](https://tanstack.com/query/latest/)
- Review [Orval Documentation](https://orval.dev/)
- Submit [GitHub Issues](https://github.com/TrevorPLam/Intelli-Task-Hub/issues)

## License

MIT License - see the main project [LICENSE](../../../LICENSE) file for details.
