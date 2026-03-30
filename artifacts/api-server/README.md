# @workspace/api-server
> Express API server providing AI-powered services and data persistence for Intelli-Task-Hub

Production-ready Express.js API server that handles authentication, OpenAI integrations, and serves as the backend for the mobile application. Built with security, performance, and scalability in mind.

## Table of Contents
- [Overview](#overview)
- [Installation](#installation)
- [Configuration](#configuration)
- [API Endpoints](#api-endpoints)
- [Security](#security)
- [Development](#development)
- [Deployment](#deployment)
- [Monitoring](#monitoring)

## Overview

### Core Features
- **OpenAI Integration** - Chat completions, image generation, and audio transcription
- **Authentication** - JWT-based API authentication with secure token handling
- **Rate Limiting** - Configurable rate limiting to prevent abuse
- **Data Persistence** - PostgreSQL integration with Drizzle ORM
- **Error Handling** - Comprehensive error handling and logging
- **Health Monitoring** - Health check endpoints for monitoring

### Technology Stack
- **Runtime**: Node.js 24+
- **Framework**: Express 5
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: JWT tokens
- **Validation**: Zod schemas
- **Logging**: Pino structured logging
- **Security**: Helmet.js, CORS, rate limiting

## Installation

### Prerequisites
- Node.js 24+
- PostgreSQL database
- OpenAI API key

### Setup Commands

```bash
# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Initialize database
pnpm --filter @workspace/db push

# Start development server
pnpm dev
```

### Environment Variables

#### Required
```bash
DATABASE_URL="postgresql://user:password@localhost:5432/intelli_task_hub"
AI_INTEGRATIONS_OPENAI_API_KEY="sk-your-openai-api-key"
API_SECRET_KEY="your-secure-jwt-secret-min-32-chars"
```

#### Optional
```bash
# Server Configuration
PORT=3000
NODE_ENV=development

# CORS Configuration
CORS_ALLOWED_ORIGINS="https://app.example.com,https://admin.example.com"

# OpenAI Configuration
AI_INTEGRATIONS_OPENAI_BASE_URL="https://api.openai.com/v1"
AI_INTEGRATIONS_OPENAI_CHAT_MODEL="gpt-4"
AI_INTEGRATIONS_OPENAI_IMAGE_MODEL="dall-e-3"
AI_INTEGRATIONS_OPENAI_AUDIO_MODEL="whisper-1"
AI_INTEGRATIONS_OPENAI_MAX_TOKENS=4096
AI_INTEGRATIONS_OPENAI_TEMPERATURE=0.7
AI_INTEGRATIONS_OPENAI_TIMEOUT_MS=30000
AI_INTEGRATIONS_OPENAI_RATE_LIMIT_RPM=60
AI_INTEGRATIONS_OPENAI_RATE_LIMIT_TPM=100000
AI_INTEGRATIONS_OPENAI_ENABLE_STREAMING=true
AI_INTEGRATIONS_OPENAI_ENABLE_IMAGES=true
AI_INTEGRATIONS_OPENAI_ENABLE_AUDIO=true
```

## Configuration

### Server Configuration
The server uses Express 5 with the following middleware stack:

```typescript
// Security middleware
app.use(helmet());                    // Security headers
app.use(cors(options));               // CORS protection
app.use(rateLimiter);                // Rate limiting
app.use(express.json({ limit: '10mb' })); // JSON parsing
app.use(express.urlencoded({ extended: true })); // URL encoding

// Logging
app.use(pinoHttp({
  level: process.env.LOG_LEVEL || 'info',
  transport: process.env.NODE_ENV === 'production' 
    ? { target: 'pino/file' }
    : { target: 'pino-pretty' }
}));
```

### Database Configuration
Uses Drizzle ORM with PostgreSQL:

```typescript
// Database connection
const db = drizzle(process.env.DATABASE_URL, {
  schema: schema,
  logger: process.env.NODE_ENV === 'development' ? console.log : false
});

// Connection pooling
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});
```

## API Endpoints

### Health Check
```http
GET /api/health
```

**Response**:
```json
{
  "status": "healthy",
  "timestamp": "2026-03-30T17:00:00.000Z",
  "version": "0.0.0",
  "database": "connected",
  "openai": "available"
}
```

### OpenAI Integration

#### Conversations
```http
POST /api/openai/conversations
```

**Request Body**:
```json
{
  "message": "Hello, how can you help me today?",
  "conversationId": "optional-existing-conversation-id",
  "stream": true
}
```

**Response (Streaming)**:
```json
{
  "id": "chatcmpl-xxx",
  "choices": [{
    "delta": { "content": "Hello! I'm here to help..." }
  }]
}
```

#### Image Generation
```http
POST /api/openai/generate-image
```

**Request Body**:
```json
{
  "prompt": "A beautiful sunset over mountains",
  "size": "1024x1024",
  "quality": "standard",
  "n": 1
}
```

**Response**:
```json
{
  "imageUrl": "https://oaidalleapiprodscus.blob.core.windows.net/...",
  "revisedPrompt": "A beautiful sunset over mountains..."
}
```

### Authentication

All API endpoints (except health checks) require JWT authentication:

```http
Authorization: Bearer <jwt-token>
```

**Token Payload**:
```json
{
  "userId": "user-uuid",
  "email": "user@example.com",
  "iat": 1640995200,
  "exp": 1641081600
}
```

## Security

### Authentication & Authorization
- JWT-based authentication with RS256 signing
- Token expiration and refresh mechanisms
- Secure token storage and transmission

### Rate Limiting
```typescript
// Default rate limits
const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP'
});

// OpenAI-specific limits
const openaiRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60, // 60 requests per minute
  keyGenerator: (req) => req.user?.userId || req.ip
});
```

### Input Validation
All request bodies are validated using Zod schemas:

```typescript
const conversationSchema = z.object({
  message: z.string().min(1).max(4000),
  conversationId: z.string().uuid().optional(),
  stream: z.boolean().default(false)
});
```

### Security Headers
Helmet.js provides comprehensive security headers:
- Content Security Policy (CSP)
- HTTP Strict Transport Security (HSTS)
- X-Frame-Options
- X-Content-Type-Options
- Referrer Policy

## Development

### Local Development
```bash
# Start development server with hot reload
pnpm dev

# Run tests in watch mode
pnpm test:watch

# Type checking
pnpm typecheck

# Linting
pnpm lint
```

### Testing
```bash
# Run all tests
pnpm test

# Run tests with coverage
pnpm test:coverage

# Run integration tests
pnpm test:integration

# Run specific test file
pnpm test routes/openai/conversations.test.ts
```

### Database Operations
```bash
# Create new migration
pnpm --filter @workspace/db generate

# Apply schema changes
pnpm --filter @workspace/db push

# Reset database (development only)
pnpm --filter @workspace/db push-force
```

### Debug Mode
Enable debug logging:
```bash
DEBUG=* pnpm dev
```

## Deployment

### Production Build
```bash
# Build production bundle
pnpm build

# Start production server
pnpm start
```

### Docker Deployment
```dockerfile
FROM node:24-alpine AS builder
WORKDIR /app
COPY package*.json ./
COPY pnpm-lock.yaml ./
RUN npm install -g pnpm
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm build

FROM node:24-alpine AS runner
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
EXPOSE 3000
CMD ["node", "dist/index.mjs"]
```

### Environment-Specific Configuration
```bash
# Development
NODE_ENV=development pnpm dev

# Production
NODE_ENV=production pnpm start

# Testing
NODE_ENV=test pnpm test
```

## Monitoring

### Health Checks
- **Endpoint**: `/api/health`
- **Frequency**: Every 30 seconds
- **Metrics**: Response time, database connectivity, OpenAI availability

### Logging
Structured logging with Pino:

```typescript
logger.info({
  method: req.method,
  url: req.url,
  userAgent: req.get('User-Agent'),
  ip: req.ip,
  responseTime: Date.now() - start
}, 'Request completed');
```

### Performance Metrics
- Request response times
- Database query performance
- OpenAI API latency
- Memory and CPU usage
- Error rates and types

### Error Handling
Comprehensive error handling strategy:

```typescript
// Custom error classes
class ValidationError extends Error {
  constructor(message: string, public details: any) {
    super(message);
    this.name = 'ValidationError';
  }
}

// Error response format
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request data",
    "details": { "field": "message", "issue": "required" }
  },
  "timestamp": "2026-03-30T17:00:00.000Z",
  "requestId": "req-uuid"
}
```

## Dependencies

### Runtime Dependencies
- `express` - Web framework
- `@workspace/db` - Database layer
- `@workspace/integrations-openai-ai-server` - AI services
- `cors` - CORS handling
- `helmet` - Security headers
- `express-rate-limit` - Rate limiting
- `pino` - Structured logging
- `zod` - Schema validation

### Development Dependencies
- `@types/express` - TypeScript definitions
- `@types/node` - Node.js types
- `vitest` - Testing framework
- `supertest` - HTTP testing
- `esbuild` - Build tool

## Related Packages

- **[@workspace/db](../../lib/db/README.md)** - Database layer and schema
- **[@workspace/integrations-openai-ai-server](../../lib/integrations-openai-ai-server/README.md)** - AI integration
- **[@workspace/api-client-react](../../lib/api-client-react/README.md)** - Generated API clients

## Support

For API-specific issues:
- Check the [API Documentation](../../docs/api.md)
- Review [OpenAI Integration Guide](../../docs/openai.md)
- Submit [GitHub Issues](https://github.com/TrevorPLam/Intelli-Task-Hub/issues)

## License

MIT License - see the main project [LICENSE](../../LICENSE) file for details.
