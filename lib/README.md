# Libraries
> Shared packages and utilities for the Intelli-Task-Hub ecosystem

This directory contains reusable libraries and utilities that provide core functionality across all applications in the monorepo. Each library is designed to be independently testable and maintainable while serving specific business needs.

## Table of Contents
- [Library Overview](#library-overview)
- [Architecture](#architecture)
- [Development](#development)
- [Code Generation](#code-generation)
- [Dependencies](#dependencies)

## Library Overview

### 📡 API Client Libraries

#### [@workspace/api-client-react](./api-client-react/)
**Purpose**: Generated React Query hooks for API communication  
**Technology**: React Query, TypeScript, Zod validation

Provides type-safe React hooks for communicating with the API server:
- Auto-generated from OpenAPI specification
- Query caching and invalidation
- Type-safe request/response handling
- Error boundary integration

#### [@workspace/api-spec](./api-spec/)
**Purpose**: OpenAPI specification and code generation configuration  
**Technology**: OpenAPI 3.1, Orval

Defines the API contract and generates client code:
- OpenAPI 3.1 specification in YAML
- Orval configuration for code generation
- Type definitions and validation schemas
- API documentation generation

#### [@workspace/api-zod](./api-zod/)
**Purpose**: Generated Zod validation schemas from OpenAPI  
**Technology**: Zod, TypeScript

Runtime type validation for API data:
- Auto-generated validation schemas
- Type-safe parsing and validation
- Error handling and reporting
- Integration with API clients

### 🗄️ Data Layer

#### [@workspace/db](./db/)
**Purpose**: Database layer with Drizzle ORM  
**Technology**: PostgreSQL, Drizzle ORM, TypeScript

Database abstraction and management:
- Schema definitions with migrations
- Type-safe database operations
- Connection pooling and management
- Seed data and utilities

### 🤖 AI Integration Libraries

#### [@workspace/integrations-openai-ai-react](./integrations-openai-ai-react/)
**Purpose**: React hooks for OpenAI services  
**Technology**: React Hooks, AudioWorklet, Web APIs

Client-side AI integration capabilities:
- Voice recording and playback
- Real-time transcription
- Audio streaming and processing
- Browser-compatible AI interactions

#### [@workspace/integrations-openai-ai-server](./integrations-openai-ai-server/)
**Purpose**: Server-side OpenAI client  
**Technology**: OpenAI API, Node.js, TypeScript

Server-side AI service integration:
- Chat completion handling
- Image generation
- Audio transcription
- Rate limiting and error handling

### 📁 Integration Directory

#### [integrations/](./integrations/)
**Purpose**: Placeholder for future integration packages  
**Status**: Empty, reserved for future use

## Architecture

### Library Dependencies

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Applications  │    │   API Clients   │    │   Data Layer    │
│                 │    │                 │    │                 │
│ • Mobile App    │◄──►│ • api-client    │◄──►│ • db            │
│ • API Server    │    │ • api-zod       │    │ • PostgreSQL    │
│ • Mockup Sandbox│    │ • api-spec      │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   AI Libraries  │    │   Validation    │    │   Database      │
│                 │    │                 │    │                 │
│ • openai-react  │    │ • Zod Schemas  │    │ • Drizzle ORM   │
│ • openai-server │    │ • Type Safety   │    │ • Migrations    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Data Flow
1. **API Spec** defines the contract between frontend and backend
2. **Code Generation** creates type-safe clients and validation
3. **Database Layer** provides persistent storage
4. **AI Libraries** handle OpenAI integration
5. **Applications** consume all libraries through clean interfaces

## Development

### Prerequisites
- Node.js 24+
- pnpm package manager
- PostgreSQL (for database operations)
- TypeScript knowledge

### Setup Commands

```bash
# Install all library dependencies
pnpm --filter "@workspace/*" install

# Type check all libraries
pnpm --filter "@workspace/*" typecheck

# Run tests across all libraries
pnpm --filter "@workspace/*" test

# Build all libraries
pnpm --filter "@workspace/*" build
```

### Development Workflow

#### API Specification Changes
```bash
# Edit OpenAPI spec
vim lib/api-spec/openapi.yaml

# Regenerate client code
pnpm --filter @workspace/api-spec codegen

# Update type definitions
pnpm --filter @workspace/api-client-react build
pnpm --filter @workspace/api-zod build
```

#### Database Changes
```bash
# Edit schema files
vim lib/db/src/schema/*.ts

# Generate migration
pnpm --filter @workspace/db generate

# Apply schema changes
pnpm --filter @workspace/db push
```

#### AI Library Development
```bash
# Work on React hooks
pnpm --filter @workspace/integrations-openai-ai-react dev

# Work on server client
pnpm --filter @workspace/integrations-openai-ai-server dev

# Run AI integration tests
pnpm --filter "@workspace/integrations-*" test
```

## Code Generation

### OpenAPI to TypeScript Pipeline

```
OpenAPI Spec (api-spec)
        ↓
    Orval Codegen
        ↓
┌─────────────────┬─────────────────┐
│   API Client    │   Zod Schemas  │
│   (React Query) │   (Validation) │
└─────────────────┴─────────────────┘
```

### Generation Commands
```bash
# Generate all API-related code
pnpm --filter @workspace/api-spec codegen

# Build generated packages
pnpm --filter @workspace/api-client-react build
pnpm --filter @workspace/api-zod build

# Type check generated code
pnpm --filter "@workspace/api-*" typecheck
```

### Generated Files
- `api-client-react/src/generated/api.ts` - React Query hooks
- `api-client-react/src/generated/api.schemas.ts` - TypeScript types
- `api-zod/src/generated/types/` - Zod validation schemas
- Type definition files (`.d.ts`) for external consumption

## Dependencies

### Internal Dependencies
Libraries depend on each other through workspace references:
- `api-client-react` → `api-zod` (for validation)
- `api-server` → `db` (database layer)
- `api-server` → `integrations-openai-ai-server` (AI services)
- `mobile` → `api-client-react` (API communication)
- `mobile` → `integrations-openai-ai-react` (AI features)

### External Dependencies
Key external dependencies across libraries:
- **Zod** - Runtime type validation
- **Drizzle ORM** - Database abstraction
- **OpenAI** - AI service integration
- **React Query** - Server state management
- **TypeScript** - Type safety and compilation

### Development Dependencies
- **Vitest** - Unit testing framework
- **ESLint** - Code linting and formatting
- **TypeScript** - Type checking and compilation

## Testing Strategy

### Unit Testing
- All libraries include comprehensive unit tests
- Test coverage requirements enforced
- Mock external dependencies for isolation

### Integration Testing
- API client integration with mock servers
- Database integration with test databases
- AI library integration with test APIs

### Type Safety
- TypeScript strict mode enabled
- Generated code type validation
- Zod runtime validation testing

## Publishing and Distribution

### Internal Distribution
Libraries are distributed internally through pnpm workspace:
- No publishing to external registries
- Version synchronization through workspace
- Atomic updates across dependent packages

### Version Management
- Semantic versioning for breaking changes
- Workspace-wide version synchronization
- Automated dependency updates

## Related Documentation

- [Main README](../README.md) - Project overview
- [Artifacts README](../artifacts/README.md) - Application documentation
- [Development Guide](../docs/development.md) - Development setup
- [API Documentation](../docs/api.md) - API reference

## Support

For library-specific issues:
- **API Libraries**: Check individual package READMEs
- **Database**: See [@workspace/db README](./db/README.md)
- **AI Integration**: See integration package READMEs
- **General Issues**: [GitHub Issues](https://github.com/TrevorPLam/Intelli-Task-Hub/issues)
