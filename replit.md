# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **AI**: OpenAI via Replit AI Integrations (gpt-5.2)

## Structure

```text
artifacts-monorepo/
├── artifacts/              # Deployable applications
│   ├── api-server/         # Express API server
│   └── mobile/             # AI Personal Assistant (Expo)
├── lib/                    # Shared libraries
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   ├── db/                 # Drizzle ORM schema + DB connection
│   ├── integrations-openai-ai-server/  # OpenAI server-side client
│   └── integrations-openai-ai-react/   # OpenAI React hooks
├── scripts/                # Utility scripts
├── pnpm-workspace.yaml
├── tsconfig.base.json
├── tsconfig.json
└── package.json
```

## AI Personal Assistant — Mobile App

4-tab Expo app built with React Native:

1. **Chat** — AI-powered chat using gpt-5.2 with persistent conversation history (stored in PostgreSQL)
2. **Tasks** — Full project management with projects, tasks, priorities (high/medium/low), statuses (todo/in_progress/done)
3. **Calendar** — Monthly calendar with event management, color coding, all-day events
4. **Email** — Email inbox with compose, reply, star, search, and delete functionality

Data persistence:

- Chat conversations: PostgreSQL via `conversations` and `messages` tables
- Tasks, Projects, Events, Emails: AsyncStorage (local persistence)

## TypeScript & Composite Projects

Every package extends `tsconfig.base.json` which sets `composite: true`. The root `tsconfig.json` lists all packages as project references.

## Root Scripts

- `pnpm run build` — runs `typecheck` first, then recursively runs `build` in all packages that define it
- `pnpm run typecheck` — runs `tsc --build --emitDeclarationOnly` using project references

## Packages

### `artifacts/mobile` (`@workspace/mobile`)

Expo 54 mobile app. Entry: `app/_layout.tsx`. Tabs in `app/(tabs)/`.

### `artifacts/api-server` (`@workspace/api-server`)

Express 5 API server. Routes: `/api/openai/conversations`, `/api/openai/generate-image`.

### `lib/db` (`@workspace/db`)

Database layer using Drizzle ORM. Tables: `conversations`, `messages`.

### `lib/api-spec` (`@workspace/api-spec`)

OpenAPI 3.1 spec + Orval codegen. Run codegen: `pnpm --filter @workspace/api-spec run codegen`

### `lib/integrations-openai-ai-server` (`@workspace/integrations-openai-ai-server`)

OpenAI server-side client (chat completions, images, audio). Uses comprehensive AI configuration with centralized validation:

**Required Environment Variables:**
- `AI_INTEGRATIONS_OPENAI_API_KEY` — OpenAI API key (auto-provisioned on Replit)

**Optional Configuration:**
- `AI_INTEGRATIONS_OPENAI_BASE_URL` — Custom OpenAI base URL (default: https://api.openai.com/v1)
- `AI_INTEGRATIONS_OPENAI_CHAT_MODEL` — Chat model (default: gpt-4)
- `AI_INTEGRATIONS_OPENAI_IMAGE_MODEL` — Image generation model (default: dall-e-3)
- `AI_INTEGRATIONS_OPENAI_AUDIO_MODEL` — Audio transcription model (default: whisper-1)
- `AI_INTEGRATIONS_OPENAI_MAX_TOKENS` — Max completion tokens (default: 4096)
- `AI_INTEGRATIONS_OPENAI_TEMPERATURE` — Request temperature 0.0-2.0 (default: 0.7)
- `AI_INTEGRATIONS_OPENAI_TIMEOUT_MS` — Request timeout in milliseconds (default: 30000)
- `AI_INTEGRATIONS_OPENAI_RATE_LIMIT_RPM` — Rate limit: requests per minute (default: 60)
- `AI_INTEGRATIONS_OPENAI_RATE_LIMIT_TPM` — Rate limit: tokens per minute (default: 100000)
- `AI_INTEGRATIONS_OPENAI_ENABLE_STREAMING` — Enable streaming responses (default: true)
- `AI_INTEGRATIONS_OPENAI_ENABLE_IMAGES` — Enable image generation (default: true)
- `AI_INTEGRATIONS_OPENAI_ENABLE_AUDIO` — Enable audio transcription (default: true)
- `AI_INTEGRATIONS_OPENAI_ORG_ID` — Optional organization ID for team accounts
- `AI_INTEGRATIONS_OPENAI_PROJECT_ID` — Optional project ID for usage tracking

All AI configuration is validated at startup with clear error messages. See `.env.example` for complete configuration options.

## Database

PostgreSQL is provisioned. Schema has `conversations` and `messages` tables.

Push schema: `pnpm --filter @workspace/db run push`

## Environment Variables

### Required

- `DATABASE_URL` — PostgreSQL connection string
- `AI_INTEGRATIONS_OPENAI_API_KEY` — OpenAI API key (auto-provisioned on Replit)
- `API_SECRET_KEY` — JWT/API key for authenticating requests (min 32 chars)

### Optional

- `CORS_ALLOWED_ORIGINS` — Comma-separated list of allowed CORS origins (e.g., `https://app.example.com,https://admin.example.com`). In development, wildcard is used if not set. In production, omitting this defaults to no cross-origin access.
- `EXPO_PUBLIC_APP_ORIGIN` — App origin for Expo Router deep linking/universal links (e.g., `https://app.example.com`). Falls back to `https://localhost` in development if not set.
- `PORT` — API server port (default: 3000)
- `NODE_ENV` — `development` or `production`

---

## Project-First Architecture Alignment

When working on this codebase, remember the app is transforming from a generic assistant shell into a **project operating system for AI-assisted work**.

### Primary Object is the Project
- All new features should be designed with project context in mind
- Chat is a capability within a project, not a standalone feature
- Ask: "How does this feature work within a project context?"

### Knowledge Must be Structured
- Favor creating MemoryItem records over relying on message history
- Design for extraction and reuse, not just transient chat
- Citations and sources are first-class, not afterthoughts

### Tasks are Linked, Not Isolated
- New task features should support linking to projects, threads, decisions, sources
- Task orchestration requires approval gates for AI-proposed actions
- Status and priority are meaningful, not cosmetic

### Provider Abstraction is Required
- All AI integration must go through the provider interface
- No hardcoded OpenAI-specific code in business logic
- Design for future Anthropic, Gemini, OpenRouter support

### Data Portability is a Feature
- All project data must be exportable
- Design with clean data boundaries for JSON/Markdown export
- Avoid tight coupling that prevents clean extraction

### Security and Trust First
- All sensitive operations validated server-side
- AI-generated content clearly labeled
- User confirmation required for high-impact actions
- Audit trail (ActivityEvent) for accountability

### Mobile-First, Web-Complemented
- Mobile app is the primary interface
- Web console is for complex project management workflows
- Design mobile-first, enhance with web

### Migration Mindset
- Prefer additive changes over destructive rewrites
- Maintain backwards compatibility during transitions
- Bridge tables and dual-write strategies for data migration
- Keep existing features working while building new project-first features
