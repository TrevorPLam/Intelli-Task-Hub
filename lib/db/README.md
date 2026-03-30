# @workspace/db
> PostgreSQL database layer with Drizzle ORM, migrations, and type-safe database operations

Core database abstraction layer providing type-safe database operations, schema management, and migration utilities for the Intelli-Task-Hub platform. Built with Drizzle ORM and PostgreSQL for optimal performance and reliability.

## Table of Contents
- [Overview](#overview)
- [Schema](#schema)
- [Installation](#installation)
- [Configuration](#configuration)
- [Migrations](#migrations)
- [Usage](#usage)
- [Development](#development)

## Overview

### Features
- **Type-Safe Operations** - Full TypeScript support with generated types
- **Schema Management** - Declarative schema definitions with migrations
- **Connection Pooling** - Optimized database connection management
- **Query Builder** - Powerful SQL query building with type safety
- **Seed Data** - Database seeding utilities for development
- **Performance Monitoring** - Query performance tracking and optimization

### Technology Stack
- **Database**: PostgreSQL 14+
- **ORM**: Drizzle ORM with TypeScript support
- **Migration Tool**: Drizzle Kit for schema management
- **Connection**: pg driver with connection pooling
- **Validation**: Zod schema integration

## Schema

### Core Tables

#### Conversations
```typescript
export const conversations = pgTable('conversations', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull(),
  title: text('title').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
```

#### Messages
```typescript
export const messages = pgTable('messages', {
  id: uuid('id').defaultRandom().primaryKey(),
  conversationId: uuid('conversation_id').references(() => conversations.id).notNull(),
  role: text('role').notNull(), // 'user' | 'assistant' | 'system'
  content: text('content').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
```

### Database Relationships
```
Conversations (1) ←→ (N) Messages
    ↓                    ↓
   userId               conversationId
    ↓                    ↓
   Users              Message Content
```

## Installation

### Prerequisites
- PostgreSQL 14+ database server
- Node.js 24+
- pnpm package manager

### Setup Commands

```bash
# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env
# Edit .env with your database configuration

# Generate migration files
pnpm run generate

# Apply schema to database
pnpm run push
```

### Environment Variables

```bash
# Required
DATABASE_URL="postgresql://username:password@localhost:5432/intelli_task_hub"

# Optional
DB_POOL_SIZE=20
DB_CONNECTION_TIMEOUT=30000
DB_IDLE_TIMEOUT=30000
```

## Configuration

### Database Connection
```typescript
// drizzle.config.ts
import { defineConfig } from 'drizzle-kit';
import { pg } from 'drizzle-kit/pg';

export default defineConfig({
  schema: './src/schema/*',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
  verbose: true,
  strict: true,
});
```

### Connection Pool Configuration
```typescript
// src/index.ts
import { drizzle } from 'drizzle-orm/postgres-js';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20, // Maximum number of connections
  idleTimeoutMillis: 30000, // Close idle connections after 30s
  connectionTimeoutMillis: 2000, // Return error after 2s if connection not established
});

export const db = drizzle(pool, { schema });
```

## Migrations

### Migration Workflow

#### 1. Schema Changes
```typescript
// src/schema/new-table.ts
import { pgTable, uuid, text, timestamp } from 'drizzle-orm/pg-core';

export const newTable = pgTable('new_table', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
```

#### 2. Generate Migration
```bash
# Generate migration from schema changes
pnpm run generate

# This creates: drizzle/0001_new_table.sql
```

#### 3. Apply Migration
```bash
# Apply migration to database
pnpm run push

# For production environments
pnpm run migrate
```

### Migration Files
```sql
-- drizzle/0001_new_table.sql
CREATE TABLE IF NOT EXISTS "new_table" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);

-- Add foreign key constraints
ALTER TABLE "messages" ADD CONSTRAINT "messages_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE cascade ON UPDATE no action;
```

### Migration Commands
```bash
# Generate new migration
pnpm run generate

# Push schema changes (development)
pnpm run push

# Push with force (development only)
pnpm run push-force

# Run migrations (production)
pnpm run migrate

# Drop all tables (development only)
pnpm run drop
```

## Usage

### Database Operations

#### Basic Queries
```typescript
import { db, schema } from '@workspace/db';
import { eq, and, desc } from 'drizzle-orm';

// Insert conversation
const newConversation = await db.insert(schema.conversations)
  .values({
    userId: 'user-uuid',
    title: 'New Conversation',
  })
  .returning()
  .get();

// Select messages for conversation
const messages = await db.select()
  .from(schema.messages)
  .where(eq(schema.messages.conversationId, conversationId))
  .orderBy(desc(schema.messages.createdAt))
  .limit(50);

// Update conversation title
const updatedConversation = await db.update(schema.conversations)
  .set({ title: 'Updated Title' })
  .where(eq(schema.conversations.id, conversationId))
  .returning()
  .get();
```

#### Advanced Queries
```typescript
// Join conversations with messages
const conversationWithMessages = await db.select({
  id: schema.conversations.id,
  title: schema.conversations.title,
  messageCount: count(schema.messages.id),
  lastMessage: max(schema.messages.createdAt),
})
  .from(schema.conversations)
  .leftJoin(schema.messages, eq(schema.conversations.id, schema.messages.conversationId))
  .where(eq(schema.conversations.userId, userId))
  .groupBy(schema.conversations.id)
  .orderBy(desc(schema.conversations.updatedAt));

// Complex filtering
const recentMessages = await db.select()
  .from(schema.messages)
  .where(and(
    eq(schema.messages.conversationId, conversationId),
    gte(schema.messages.createdAt, new Date(Date.now() - 24 * 60 * 60 * 1000))
  ))
  .orderBy(desc(schema.messages.createdAt));
```

#### Transactions
```typescript
import { db } from '@workspace/db';

// Transaction for creating conversation with initial message
const result = await db.transaction(async (tx) => {
  const conversation = await tx.insert(schema.conversations)
    .values({
      userId: 'user-uuid',
      title: 'New Conversation',
    })
    .returning()
    .get();

  const message = await tx.insert(schema.messages)
    .values({
      conversationId: conversation.id,
      role: 'user',
      content: 'Hello, AI!',
    })
    .returning()
    .get();

  return { conversation, message };
});
```

### Type Safety

#### Generated Types
```typescript
// Infer types from schema
export type Conversation = typeof schema.conversations.$inferSelect;
export type NewConversation = typeof schema.conversations.$inferInsert;
export type Message = typeof schema.messages.$inferSelect;
export type NewMessage = typeof schema.messages.$inferInsert;

// Usage in application code
function createConversation(data: NewConversation): Promise<Conversation> {
  return db.insert(schema.conversations).values(data).returning().get();
}
```

#### Zod Integration
```typescript
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';

// Generate Zod schemas from Drizzle schema
const insertConversationSchema = createInsertSchema(schema.conversations);
const selectConversationSchema = createSelectSchema(schema.conversations);

// Validate input
const validatedData = insertConversationSchema.parse(inputData);
```

## Development

### Local Development Setup

#### Docker PostgreSQL (Recommended)
```bash
# Start PostgreSQL container
docker run --name postgres-dev \
  -e POSTGRES_DB=intelli_task_hub \
  -e POSTGRES_USER=dev \
  -e POSTGRES_PASSWORD=dev \
  -p 5432:5432 \
  postgres:14

# Set environment variable
export DATABASE_URL="postgresql://dev:dev@localhost:5432/intelli_task_hub"
```

#### Local PostgreSQL
```bash
# Create database
createdb intelli_task_hub

# Set environment variable
export DATABASE_URL="postgresql://$(whoami):@localhost:5432/intelli_task_hub"
```

### Testing

#### Unit Tests
```typescript
// src/__tests__/db.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { db, schema } from '../index';
import { migrate } from 'drizzle-kit/pg';

describe('Database Operations', () => {
  beforeEach(async () => {
    // Set up test database
    await migrate();
  });

  afterEach(async () => {
    // Clean up test data
    await db.delete(schema.messages);
    await db.delete(schema.conversations);
  });

  it('should create conversation', async () => {
    const conversation = await db.insert(schema.conversations)
      .values({
        userId: 'test-user',
        title: 'Test Conversation',
      })
      .returning()
      .get();

    expect(conversation).toBeDefined();
    expect(conversation.title).toBe('Test Conversation');
  });
});
```

#### Integration Tests
```bash
# Run database tests
pnpm test

# Run with coverage
pnpm test:coverage

# Run specific test file
pnpm test db.test.ts
```

### Performance Monitoring

#### Query Performance
```typescript
// Enable query logging in development
if (process.env.NODE_ENV === 'development') {
  const originalQuery = db.query;
  db.query = async (...args) => {
    const start = Date.now();
    const result = await originalQuery(...args);
    const duration = Date.now() - start;
    
    if (duration > 100) {
      console.warn(`Slow query (${duration}ms):`, args[0]);
    }
    
    return result;
  };
}
```

#### Connection Monitoring
```typescript
// Monitor connection pool
pool.on('connect', (client) => {
  console.log('New database connection established');
});

pool.on('remove', (client) => {
  console.log('Database connection removed');
});

pool.on('error', (err, client) => {
  console.error('Database connection error:', err);
});
```

## Best Practices

### Schema Design
- Use UUID primary keys for distributed systems
- Add created_at and updated_at timestamps
- Use appropriate column types and constraints
- Define foreign key relationships explicitly
- Add indexes for frequently queried columns

### Query Optimization
- Use specific column selection instead of SELECT *
- Implement proper pagination with LIMIT/OFFSET
- Use joins efficiently with proper indexing
- Consider materialized views for complex queries
- Monitor and optimize slow queries

### Error Handling
```typescript
// Handle database errors gracefully
try {
  const result = await db.insert(schema.conversations)
    .values(data)
    .returning()
    .get();
  return result;
} catch (error) {
  if (error.code === '23505') { // Unique violation
    throw new Error('Conversation already exists');
  }
  if (error.code === '23503') { // Foreign key violation
    throw new Error('Invalid user reference');
  }
  throw error; // Re-throw unknown errors
}
```

## Dependencies

### Runtime Dependencies
- `drizzle-orm` - Database ORM and query builder
- `postgres` - PostgreSQL driver
- `pg` - PostgreSQL client with connection pooling
- `drizzle-zod` - Zod schema integration

### Development Dependencies
- `drizzle-kit` - Migration and CLI tools
- `@types/pg` - PostgreSQL TypeScript definitions
- `vitest` - Testing framework

## Related Packages

- **[@workspace/api-server](../../artifacts/api-server/README.md)** - API server using this database layer
- **[@workspace/api-zod](../api-zod/README.md)** - Generated validation schemas
- **[@workspace/api-spec](../api-spec/README.md)** - API specification

## Troubleshooting

### Common Issues

#### Connection Errors
```bash
# Check PostgreSQL server status
pg_isready -h localhost -p 5432

# Test connection
psql $DATABASE_URL -c "SELECT 1;"
```

#### Migration Issues
```bash
# Check migration status
pnpm run generate

# Force reset (development only)
pnpm run push-force

# Drop and recreate (development only)
pnpm run drop && pnpm run push
```

#### Performance Issues
- Check connection pool configuration
- Analyze slow queries with EXPLAIN ANALYZE
- Monitor database connections and resource usage
- Consider adding appropriate indexes

## Support

For database-related issues:
- Check [Drizzle Documentation](https://orm.drizzle.team/)
- Review [PostgreSQL Docs](https://www.postgresql.org/docs/)
- Submit [GitHub Issues](https://github.com/TrevorPLam/Intelli-Task-Hub/issues)

## License

MIT License - see the main project [LICENSE](../../../LICENSE) file for details.
