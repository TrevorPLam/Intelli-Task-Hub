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

OpenAI server-side client (chat completions, images, audio). Uses `AI_INTEGRATIONS_OPENAI_BASE_URL` and `AI_INTEGRATIONS_OPENAI_API_KEY` env vars (auto-provisioned by Replit).

## Database

PostgreSQL is provisioned. Schema has `conversations` and `messages` tables.

Push schema: `pnpm --filter @workspace/db run push`
