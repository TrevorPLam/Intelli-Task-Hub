# Intelli-Task-Hub
> AI-powered productivity platform with intelligent task management and personal assistant capabilities

A comprehensive monorepo containing an AI personal assistant mobile app, API server, and shared libraries built with TypeScript, React Native, and modern web technologies.

## Table of Contents
- [Overview](#overview)
- [Architecture](#architecture)
- [Quick Start](#quick-start)
- [Development](#development)
- [Packages](#packages)
- [Security](#security)
- [Contributing](#contributing)
- [License](#license)

## Overview

Intelli-Task-Hub is a sophisticated productivity platform that combines AI-powered conversation management with comprehensive task handling capabilities. The system features a mobile-first design with offline support and real-time synchronization.

### Key Features
- **AI Personal Assistant** - GPT-5.2 powered conversations with persistent history
- **Task Management** - Full project management with priorities and status tracking
- **Calendar Integration** - Monthly calendar with event management and color coding
- **Email Interface** - Complete email client with compose, reply, and search functionality
- **Offline Support** - Local persistence with AsyncStorage
- **Real-time Sync** - PostgreSQL backend with API synchronization

## Architecture

### Technology Stack
- **Monorepo**: pnpm workspaces with TypeScript composite projects
- **Mobile**: Expo 54 with React Native and TypeScript
- **Backend**: Express 5 API server with Node.js 24
- **Database**: PostgreSQL with Drizzle ORM
- **AI**: OpenAI GPT-5.2 integration via Replit AI services
- **Validation**: Zod schemas with automated code generation
- **Build**: esbuild for bundling, Turbo for monorepo orchestration

### System Design
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Mobile App    │    │   API Server    │    │   PostgreSQL    │
│   (Expo)       │◄──►│   (Express)     │◄──►│   (Database)    │
│                 │    │                 │    │                 │
│ • Chat UI       │    │ • OpenAI Routes │    │ • Conversations │
│ • Task Manager  │    │ • Auth/Rate Lim │    │ • Messages      │
│ • Calendar      │    │ • Validation    │    │                 │
│ • Email Client  │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Quick Start

### Prerequisites
- Node.js 24+
- pnpm package manager
- PostgreSQL database
- OpenAI API key (auto-provisioned on Replit)

### Installation

```bash
# Clone the repository
git clone https://github.com/TrevorPLam/Intelli-Task-Hub.git
cd Intelli-Task-Hub

# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Initialize database
pnpm --filter @workspace/db run push

# Start development servers
pnpm dev
```

### Environment Variables

#### Required
- `DATABASE_URL` - PostgreSQL connection string
- `AI_INTEGRATIONS_OPENAI_API_KEY` - OpenAI API key
- `API_SECRET_KEY` - JWT/API authentication key (min 32 chars)

#### Optional
- `CORS_ALLOWED_ORIGINS` - Comma-separated allowed origins
- `EXPO_PUBLIC_APP_ORIGIN` - App origin for deep linking
- `PORT` - API server port (default: 3000)
- `NODE_ENV` - Environment (development/production)

## Development

### Workspace Scripts
```bash
# Build all packages
pnpm build

# Type checking across monorepo
pnpm typecheck

# Run tests
pnpm test

# Lint and format
pnpm lint
pnpm format

# Clean build artifacts
pnpm clean
```

### Package-Specific Development
```bash
# API server development
pnpm --filter @workspace/api-server dev

# Mobile app development
pnpm --filter @workspace/mobile dev

# Database operations
pnpm --filter @workspace/db push
pnpm --filter @workspace/db generate

# API code generation
pnpm --filter @workspace/api-spec codegen
```

### Testing
- **Unit Tests**: Vitest with coverage reporting
- **Integration Tests**: Supertest for API endpoints
- **E2E Tests**: Playwright for mobile app flows
- **Type Checking**: TypeScript composite project validation

## Packages

### 🚀 Applications (`/artifacts`)
- **[@workspace/api-server](./artifacts/api-server/)** - Express API server with OpenAI integration
- **[@workspace/mobile](./artifacts/mobile/)** - Expo React Native mobile application
- **[@workspace/mockup-sandbox](./artifacts/mockup-sandbox/)** - Vite React component playground

### 📚 Libraries (`/lib`)
- **[@workspace/api-client-react](./lib/api-client-react/)** - Generated React Query hooks
- **[@workspace/api-spec](./lib/api-spec/)** - OpenAPI specification and Orval configuration
- **[@workspace/api-zod](./lib/api-zod/)** - Generated Zod validation schemas
- **[@workspace/db](./lib/db/)** - Drizzle ORM schema and database utilities
- **[@workspace/integrations-openai-ai-react](./lib/integrations-openai-ai-react/)** - React hooks for OpenAI services
- **[@workspace/integrations-openai-ai-server](./lib/integrations-openai-ai-server/)** - Server-side OpenAI client

### 🛠️ Development (`/scripts`)
- **[@workspace/scripts](./scripts/)** - Automation and utility scripts

## Security

### AI Integration Security
- OpenAI API key validation and secure storage
- Rate limiting and request timeout protection
- Input validation with Zod schemas
- Audio worklet same-origin policy enforcement

### API Security
- JWT-based authentication
- CORS configuration
- Rate limiting with express-rate-limit
- Helmet.js security headers
- Request validation and sanitization

### Data Protection
- Environment variable encryption
- Secure database connections
- Local data encryption for sensitive information
- Audit logging for security events

## Contributing

We welcome contributions to Intelli-Task-Hub! Please follow our guidelines:

### Development Workflow
1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes with proper testing
4. Ensure type checking and linting pass: `pnpm typecheck && pnpm lint`
5. Submit a pull request with comprehensive description

### Code Standards
- TypeScript strict mode enabled
- ESLint and Prettier configuration enforced
- Comprehensive test coverage required
- Documentation updates for new features
- Semantic versioning for releases

### Issue Reporting
- Use GitHub Issues with proper templates
- Include reproduction steps and environment details
- Provide logs and error messages
- Tag appropriate team members

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

- **Documentation**: See individual package READMEs for detailed information
- **Issues**: [GitHub Issues](https://github.com/TrevorPLam/Intelli-Task-Hub/issues)
- **Discussions**: [GitHub Discussions](https://github.com/TrevorPLam/Intelli-Task-Hub/discussions)

---

**Built with ❤️ using modern web technologies and AI integration**
