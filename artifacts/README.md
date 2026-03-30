# Artifacts
> Deployable applications and runtime components of the Intelli-Task-Hub platform

This directory contains the production-ready applications that make up the Intelli-Task-Hub ecosystem. Each artifact is a self-contained deployable unit with its own build process and dependencies.

## Table of Contents
- [Applications Overview](#applications-overview)
- [Development](#development)
- [Deployment](#deployment)
- [Architecture](#architecture)

## Applications Overview

### 📱 Mobile Application
**Package**: `@workspace/mobile`  
**Technology**: Expo 54, React Native, TypeScript

AI-powered mobile personal assistant with four main tabs:
- **Chat** - GPT-5.2 conversations with persistent history
- **Tasks** - Project and task management with priorities
- **Calendar** - Monthly calendar with event management
- **Email** - Full email client with compose and search

**Key Features**:
- Offline-first design with AsyncStorage
- Real-time synchronization with API server
- Native performance with React Native
- Cross-platform (iOS/Android/Web) support

### 🖥️ API Server
**Package**: `@workspace/api-server`  
**Technology**: Express 5, Node.js, TypeScript

RESTful API server providing backend services for the mobile application.

**Key Endpoints**:
- `/api/openai/conversations` - Chat completion and conversation management
- `/api/openai/generate-image` - AI image generation
- `/api/health` - Health check and monitoring

**Features**:
- JWT authentication
- Rate limiting and security headers
- OpenAI integration with streaming support
- Comprehensive error handling and logging

### 🎨 Mockup Sandbox
**Package**: `@workspace/mockup-sandbox`  
**Technology**: Vite, React, TypeScript, Tailwind CSS

Interactive component development playground for UI design and prototyping.

**Purpose**:
- Component testing and validation
- Design system development
- Interactive prototyping
- Performance benchmarking

**Features**:
- Hot module replacement
- Comprehensive UI component library
- Real-time preview capabilities
- Design system integration

## Development

### Prerequisites
- Node.js 24+
- pnpm package manager
- Expo CLI (for mobile development)
- PostgreSQL (for API server)

### Setup Commands

```bash
# Install all artifact dependencies
pnpm --filter "@workspace/*" install

# Start all development servers
pnpm dev

# Start individual applications
pnpm --filter @workspace/mobile dev
pnpm --filter @workspace/api-server dev
pnpm --filter @workspace/mockup-sandbox dev
```

### Development Workflow

#### Mobile Application
```bash
# Start Expo development server
pnpm --filter @workspace/mobile dev

# Build for production
pnpm --filter @workspace/mobile build

# Run tests
pnpm --filter @workspace/mobile test
```

#### API Server
```bash
# Start development server with hot reload
pnpm --filter @workspace/api-server dev

# Build production bundle
pnpm --filter @workspace/api-server build

# Run API tests
pnpm --filter @workspace/api-server test
```

#### Mockup Sandbox
```bash
# Start Vite development server
pnpm --filter @workspace/mockup-sandbox dev

# Build static assets
pnpm --filter @workspace/mockup-sandbox build

# Preview production build
pnpm --filter @workspace/mockup-sandbox preview
```

## Deployment

### Mobile Application

#### Expo Application Services (Recommended)
```bash
# Build for deployment
expo build:android
expo build:ios

# Deploy updates over-the-air
expo publish
```

#### Self-Hosted
```bash
# Export for web deployment
expo export

# Build standalone binaries
expo build:android --type apk
expo build:ios --type archive
```

### API Server

#### Docker Deployment
```dockerfile
FROM node:24-alpine
WORKDIR /app
COPY . .
RUN pnpm install --production
RUN pnpm build
EXPOSE 3000
CMD ["node", "dist/index.mjs"]
```

#### Traditional Deployment
```bash
# Build and start
pnpm --filter @workspace/api-server build
pnpm --filter @workspace/api-server start
```

### Mockup Sandbox

#### Static Hosting (Vercel/Netlify)
```bash
# Build static files
pnpm --filter @workspace/mockup-sandbox build

# Deploy to Vercel
vercel --prod dist/

# Deploy to Netlify
netlify deploy --prod --dir=dist/
```

## Architecture

### Inter-Application Communication

```
┌─────────────────┐    HTTP/WS     ┌─────────────────┐
│   Mobile App    │◄──────────────►│   API Server    │
│                 │                │                 │
│ • React Native  │                │ • Express.js    │
│ • Expo Router   │                │ • OpenAI API    │
│ • AsyncStorage  │                │ • PostgreSQL    │
└─────────────────┘                └─────────────────┘
         │                                   │
         │ Local Storage                      │ Database
         ▼                                   ▼
┌─────────────────┐                ┌─────────────────┐
│   Device Storage│                │   PostgreSQL    │
│                 │                │                 │
│ • Conversations │                │ • Messages      │
│ • Tasks        │                │ • Users         │
│ • Events       │                │ • Sessions      │
└─────────────────┘                └─────────────────┘
```

### Data Flow
1. **Mobile App** stores data locally for offline access
2. **API Server** provides authentication and AI services
3. **Database** maintains persistent conversation history
4. **Mockup Sandbox** operates independently for development

### Security Considerations
- API endpoints protected with JWT authentication
- Rate limiting prevents abuse
- Input validation with Zod schemas
- HTTPS required for production deployments
- Environment-based configuration management

## Related Packages

These artifacts depend on shared libraries from the `/lib` directory:

- **[@workspace/db](../lib/db/)** - Database layer and ORM
- **[@workspace/api-client-react](../lib/api-client-react/)** - Generated API clients
- **[@workspace/integrations-openai-ai-react](../lib/integrations-openai-ai-react/)** - AI integration hooks
- **[@workspace/integrations-openai-ai-server](../lib/integrations-openai-ai-server/)** - Server-side AI client

## Support

For application-specific issues:
- **Mobile**: Check [Mobile README](./mobile/README.md)
- **API Server**: Check [API Server README](./api-server/README.md)
- **Mockup Sandbox**: Check [Mockup Sandbox README](./mockup-sandbox/README.md)

For general issues and questions, refer to the [main README](../README.md).
