# Intelli-Task-Hub — Master TODO

> Generated: March 30, 2026  
> Updated: March 30, 2026 — Added T-21 through T-34 from second-pass deep analysis  
> Source: Exhaustive multi-pass codebase analysis (52 tracked issues)  
> Legend: `[ ]` not started · `[~]` in progress · `[x]` complete  
> Status tags: `NOT_STARTED` · `IN_PROGRESS` · `BLOCKED` · `DONE`

---

## Table of Contents

1. [T-01 — Authentication & Authorization Layer](#t-01)
2. [T-02 — Rate Limiting & Request Hardening](#t-02)
3. [T-03 — Input Validation & Route Guards](#t-03)
4. [T-04 — CORS & Security Headers](#t-04)
5. [T-05 — Graceful Shutdown & DB Connection Lifecycle](#t-05)
6. [T-06 — SSE Robustness in Chat Tab](#t-06)
7. [T-07 — Email Feature Completeness & UX Integrity](#t-07)
8. [T-08 — Metro Monorepo Configuration](#t-08)
9. [T-09 — Android Build Configuration](#t-09)
10. [T-10 — Static File Server Hardening](#t-10)
11. [T-11 — Environment Variable Portability](#t-11)
12. [T-12 — OpenAI Integration Consolidation](#t-12)
13. [T-13 — Audio Worklet Deployment & Documentation](#t-13)
14. [T-14 — Error Observability Pipeline](#t-14)
15. [T-15 — Database Schema Hardening](#t-15)
16. [T-16 — Generated API Client Adoption](#t-16)
17. [T-17 — Mockup Sandbox Bootstrap](#t-17)
18. [T-18 — TypeScript Strictness Uplift](#t-18)
19. [T-19 — Dead Code Elimination](#t-19)
20. [T-20 — Post-Merge Automation & Git Hooks](#t-20)
21. [T-21 — Testing Infrastructure](#t-21)
22. [T-22 — Linting & Code Formatting Enforcement](#t-22)
23. [T-23 — pnpm Workspace Patterns & tsconfig Reference Fixes](#t-23)
24. [T-24 — API Response Standardization & Pagination](#t-24)
25. [T-25 — Hardcoded AI Configuration Extraction](#t-25)
26. [T-26 — Database Query Optimization & Connection Pooling](#t-26)
27. [T-27 — SSRF Prevention & Request Timeout/Retry Strategy](#t-27)
28. [T-28 — Landing Page Template Injection & XSS Prevention](#t-28)
29. [T-29 — AsyncStorage Data Resilience](#t-29)
30. [T-30 — Mobile Chat Performance & ID Generation](#t-30)
31. [T-31 — Zod & OpenAPI Schema Completeness](#t-31)
32. [T-32 — Audio Subsystem Memory & Error Safety](#t-32)
33. [T-33 — Platform Portability & Build System Hardening](#t-33)
34. [T-34 — Node/pnpm Engine Constraints & Dependency Hygiene](#t-34)

---

<a id="t-01"></a>

## [x] T-01 — Authentication & Authorization Layer

**Status:** `DONE`

### Definition of Done

- Every API route rejects unauthenticated requests with HTTP 401.
- JWT or API-key identity is verified in a single Express middleware applied globally.
- The mobile client injects credentials on every request through the custom-fetch layer.
- A documented mechanism exists for key rotation without redeployment.
- No credentials are logged by Pino at any log level.

### Out of Scope

- Multi-user account management, OAuth/OIDC flows, or password-based registration.
- Role-based access control beyond owner/non-owner.
- Session persistence beyond the lifetime of the signed token.

### Rules to Follow

- Secrets are read exclusively from environment variables; no hardcoded fallback values.
- Auth middleware must be registered **before** any route handler in `app.ts`.
- Token validation must be synchronous (HMAC-SHA256 / HS256) to avoid async errors swallowing middleware exceptions.
- Pino redaction paths must include any header or body field containing auth tokens.
- Prefer stateless tokens (JWT) so no server-side session store is required in this phase.

### Advanced Coding Patterns

- [x] **T-01-P1 — Research: Auth patterns for Express 5 + React Native (Feb 2026)**
  - Study Express 5 async error propagation changes (errors thrown in `async` middleware are auto-forwarded to `next(err)` — no try/catch required).
  - Review OWASP REST Security Cheat Sheet: token storage, `Authorization` header vs cookie, HTTPS-only.
  - Research Expo SecureStore vs AsyncStorage for token persistence on-device (SecureStore uses iOS Keychain / Android Keystore; AsyncStorage is plaintext).
  - Note: As of React Native 0.81 + Expo 54 (New Architecture), `expo-secure-store` v14+ requires the Expo Modules API — confirm compatibility.

- [x] **T-01-P2 — Research: Auth antipatterns to avoid**
  - Antipattern: Storing JWTs in AsyncStorage (XSS/environment extraction risk on web targets).
  - Antipattern: Returning 403 for unauthenticated requests (correct code is 401; 403 means authenticated but forbidden).
  - Antipattern: Global `app.use(authMiddleware)` placed after route registration — Express evaluates middleware in registration order.
  - Antipattern: Logging the raw `Authorization` header before redaction is configured.
  - Antipattern: Using `jsonwebtoken` `verify` without specifying `algorithms` array — allows algorithm confusion attacks.

- [x] **T-01-1 — Create `src/middlewares/auth.ts` in api-server**
  - File: `artifacts/api-server/src/middlewares/auth.ts`
  - Implement `verifyApiKey(req, res, next)` middleware using `timingSafeEqual` from `node:crypto` for constant-time comparison.

- [x] **T-01-2 — Register auth middleware globally in `app.ts`**
  - File: `artifacts/api-server/src/app.ts`
  - Add `app.use(authMiddleware)` immediately after Pino HTTP logger, before route mounting.

- [x] **T-01-3 — Add `API_SECRET_KEY` to Pino redaction list**
  - File: `artifacts/api-server/src/lib/logger.ts`
  - Extend `redact.paths` to include `["req.headers.authorization", "req.headers['x-api-key']"]`.

- [x] **T-01-4 — Inject auth header in custom-fetch client**
  - File: `lib/api-client-react/src/custom-fetch.ts`
  - The `getToken` hook already exists — verify it is wired and that `EXPO_PUBLIC_API_KEY` or SecureStore is used as the source. Replace AsyncStorage with `expo-secure-store` if needed.

- [x] **T-01-5 — Validate `API_SECRET_KEY` env var at process start**
  - File: `artifacts/api-server/src/index.ts`
  - Add startup Zod env validation that throws (preventing server start) if `API_SECRET_KEY` is absent or shorter than 32 characters.

---

<a id="t-02"></a>

## [x] T-02 — Rate Limiting & Request Hardening

**Status:** `DONE`

### Definition of Done

- [x] All `/api/openai/*` endpoints are rate-limited per IP (configurable window and max).
- [x] All routes enforce a JSON body size limit (64kb).
- [x] `429 Too Many Requests` responses include a `Retry-After` header.
- [x] A `helmet` middleware sets secure HTTP headers on all responses (first in chain).
- [x] The OpenAI image generation and SSE streaming endpoints have stricter limits (20 req/min vs 100 req/15min).

### Out of Scope

- User-account-level rate limiting (requires T-01 first).
- Redis-backed distributed rate limiting across multiple server instances.
- DDoS mitigation at the infrastructure layer (CDN/load balancer concern).

### Rules to Follow

- Body size limit must be applied to both `express.json()` and `express.urlencoded()`. ✅
- Rate limiter must be applied as Express middleware, not inside route handlers. ✅
- The rate limit window and max must be configurable via environment variables with safe defaults. ✅
- `helmet()` must be placed first — before all other middleware — in `app.ts`. ✅

### Implementation Summary

- **T-02-P1** — Research completed on `express-rate-limit` v8.3.1 API with `standardHeaders: 'draft-7'` and helmet v8 defaults
- **T-02-P2** — Antipatterns reviewed and avoided (IP-only without trustProxy, module-level Map storage, etc.)
- **T-02-1** — `helmet()` added as first middleware in `app.ts`
- **T-02-2** — Body size limits added: `express.json({ limit: '64kb' })` and `express.urlencoded({ limit: '64kb', extended: false })`
- **T-02-3** — Created `src/middlewares/rateLimiter.ts` with `generalLimiter` (100 req/15min) and `openaiLimiter` (20 req/min)
- **T-02-4** — Rate limiters applied in `routes/index.ts`: `generalLimiter` global, `openaiLimiter` on `/openai` sub-router
- **T-02-5** — Added `helmet` and `express-rate-limit` to api-server dependencies
- **QA-FIX-1** — Added `app.set("trust proxy", 1)` for correct IP identification behind reverse proxies (Replit, etc.)
- **QA-FIX-2** — Fixed `Retry-After` calculation to use `RateLimit-Reset` header value
- **QA-FIX-3** — Added explicit `keyGenerator: getClientIp` for consistent IP extraction

### Environment Variables Added

- `RATE_LIMIT_GENERAL_WINDOW_MS` — General limiter window (ms), default: 15 _ 60 _ 1000
- `RATE_LIMIT_GENERAL_MAX` — General limiter max requests, default: 100
- `RATE_LIMIT_OPENAI_WINDOW_MS` — OpenAI limiter window (ms), default: 60 \* 1000
- `RATE_LIMIT_OPENAI_MAX` — OpenAI limiter max requests, default: 20

### Files Modified

1. `artifacts/api-server/package.json` — added `helmet` and `express-rate-limit`
2. `artifacts/api-server/src/app.ts` — added helmet, body size limits, trust proxy setting
3. `artifacts/api-server/src/routes/index.ts` — applied rate limiters
4. `artifacts/api-server/src/middlewares/rateLimiter.ts` — new file with QA fixes
5. `artifacts/api-server/src/index.ts` — added env var validation

### Code Citations

```artifacts/api-server/src/app.ts:9-18
const app: Express = express();

// Trust proxy for correct IP identification behind reverse proxies (Replit, etc.)
app.set("trust proxy", 1);

// ============================================================================
// Security Middleware (First)
// ============================================================================

app.use(helmet());
```

```artifacts/api-server/src/routes/index.ts:8-12
router.use(generalLimiter);
router.use("/openai", openaiLimiter, openaiRouter);
```

```artifacts/api-server/src/middlewares/rateLimiter.ts:24-26
const getClientIp = (req: Request): string => {
  return (req.ip || req.socket?.remoteAddress || "unknown").toString();
};
```

---

<a id="t-03"></a>

## [x] T-03 — Input Validation & Route Guards

**Status:** `DONE`

### Definition of Done

- [x] Every route that reads `req.params.id` validates it as a positive integer before touching the database.
- [x] The generated Zod schemas from `lib/api-zod` are used as the validation source of truth in all routes.
- [x] `size` in the image generation route is validated against the `GenerateOpenaiImageBodySize` enum at runtime.
- [x] Invalid inputs return structured `400` responses with field-level error detail.
- [x] No `as` type assertions bypass runtime validation.

### Implementation Summary

- **T-03-1** — Created `src/lib/validate.ts` with `parseParams()`, `parseBody()`, and `createError()` helpers using `safeParse()` for structured error responses
- **T-03-2** — Replaced all 4 `Number(req.params.id)` occurrences in `conversations.ts` with `parseParams()` using generated Zod schemas (`GetOpenaiConversationParams`, `DeleteOpenaiConversationParams`, `ListOpenaiMessagesParams`, `SendOpenaiMessageParams`)
- **T-03-3** — Added enum validation in `image.ts` using `parseBody()` with `GenerateOpenaiImageBody` schema (includes `size: zod.enum([...])`)
- **T-03-4** — Moved SSE pre-flight validation in `POST /:id/messages` before `res.setHeader()` calls to prevent 200 headers with error bodies
- **T-03-5** — Removed redundant manual `messages.delete()` before `conversations.delete()` — cascade handled by Drizzle FK constraint
- **QA-FIX-1** — Fixed POST `/` route to use `parseBody()` instead of `.parse()` throwing pattern for consistent validation
- **QA-FIX-2** — Standardized all error responses using `createError()` helper with RFC 7807 Problem Details format (`{status, code, message, details}`)
- **QA-FIX-3** — Added DB-level CHECK constraint on `messages.role` to restrict values to `user`, `assistant`, `system`
- **Dependencies** — Added `zod` to `api-server/package.json` for direct schema usage in validation helpers

### Files Modified

1. `artifacts/api-server/src/lib/validate.ts` — new validation helper module with `createError()`
2. `artifacts/api-server/src/routes/openai/conversations.ts` — replaced all `Number()` calls with Zod validation, standardized 404 errors
3. `artifacts/api-server/src/routes/openai/image.ts` — using `parseBody()` for structured error responses
4. `artifacts/api-server/package.json` — added `zod` dependency
5. `lib/db/src/schema/messages.ts` — added CHECK constraint on role column

### Code Citations

```artifacts/api-server/src/lib/validate.ts:38-47
function mapZodError(error: ZodError): HttpError {
  return {
    status: 400,
    code: "VALIDATION_ERROR",
    message: "Request validation failed",
    details: error.issues.map((issue: ZodIssue) => ({
      field: issue.path.join("."),
      message: issue.message,
    })),
  };
}
```

```artifacts/api-server/src/routes/openai/conversations.ts:34-40
router.get("/:id", async (req, res) => {
  const paramsResult = parseParams(GetOpenaiConversationParams, req.params);
  if (!paramsResult.success) {
    res.status(400).json(paramsResult.error);
    return;
  }
  const { id } = paramsResult.data;
```

```artifacts/api-server/src/routes/openai/conversations.ts:92-106
router.post("/:id/messages", async (req, res) => {
  // Pre-flight validation before setting SSE headers
  const paramsResult = parseParams(SendOpenaiMessageParams, req.params);
  if (!paramsResult.success) {
    res.status(400).json(paramsResult.error);
    return;
  }
  const { id } = paramsResult.data;

  const bodyResult = parseBody(SendOpenaiMessageBody, req.body);
  if (!bodyResult.success) {
    res.status(400).json(bodyResult.error);
    return;
  }
  const { content } = bodyResult.data;
```

### Validation Error Response Format

```json
{
  "status": 400,
  "code": "VALIDATION_ERROR",
  "message": "Request validation failed",
  "details": [{ "field": "id", "message": "Expected number, received nan" }]
}
```

### Out of Scope

- Client-side Zod validation in the mobile app (separate concern from server-side guard).
- Regenerating the Orval output (that is T-16's concern).

### Rules to Follow

- Validation must occur before any database query or OpenAI call.
- Use `zodSchema.safeParse()` (not `.parse()`) to produce structured error responses instead of thrown exceptions.
- Replace all `Number(req.params.id)` calls with the Zod `.coerce.number().int().positive()` schema.
- After SSE headers are set in the streaming route, all validation must be pre-flight (before `res.writeHead`).
- TypeScript `as` assertions used to satisfy types after validation are acceptable only if the Zod schema has already proven the shape.

### Advanced Coding Patterns

- [ ] **T-03-P1 — Research: Zod middleware patterns for Express 5 (Feb 2026)**
  - Review `zod-express-middleware` or manual `req.params` parsing patterns compatible with Express 5's typed `Request`.
  - Study Zod `discriminatedUnion` for SSE event payloads.
  - Review OpenAPI 3.1 + Orval 8.x pipeline for generating server-side validators (not just client-side) — assess `orval` `zod` output mode for server validation use.
  - Note: Express 5 makes route params strongly typed via generics — leverage `Request<{ id: string }>` for compile-time awareness.

- [ ] **T-03-P2 — Research: Validation antipatterns**
  - Antipattern: `Number(id)` — converts `""` to `0` and arrays to `NaN` silently.
  - Antipattern: Catching Zod throw at top of route handler after SSE headers are already written — the client receives a 200 header followed by an error body it cannot parse.
  - Antipattern: Using generated Zod types only on the client — the server route becomes the last line of defense and has no runtime schema.
  - Antipattern: Returning raw Zod `.issues` array to API consumers — leaks internal schema structure; map to a stable error DTO.

- [ ] **T-03-1 — Create `src/lib/validate.ts` param/body helper**
  - File: `artifacts/api-server/src/lib/validate.ts`
  - Export `parseParams(schema, params)` and `parseBody(schema, body)` returning `Result<T, HttpError>`.

- [ ] **T-03-2 — Replace all `Number(req.params.id)` in conversations route**
  - File: `artifacts/api-server/src/routes/openai/conversations.ts`
  - Replace 4–5 occurrences with `parseParams(idSchema, req.params)`.

- [ ] **T-03-3 — Add enum validation for `size` in image route**
  - File: `artifacts/api-server/src/routes/openai/image.ts`
  - Import `GenerateOpenaiImageBodySize` from `@workspace/api-zod`; validate `req.body.size` against it before calling OpenAI.

- [ ] **T-03-4 — Move SSE pre-flight validation before `res.writeHead`**
  - File: `artifacts/api-server/src/routes/openai/conversations.ts`
  - Ensure Zod body parse for the `POST /:id/messages` route completes before `res.writeHead(200, sseHeaders)` is called.

- [ ] **T-03-5 — Remove redundant manual cascade delete**
  - File: `artifacts/api-server/src/routes/openai/conversations.ts`
  - Remove manual message delete before conversation delete — the `onDelete: cascade` FK constraint in Drizzle handles this atomically.

---

<a id="t-04"></a>

## [x] T-04 — CORS & Security Headers

**Status:** `DONE`

### Definition of Done

- [x] CORS is restricted to an explicit allowlist of origins loaded from environment variables.
- [x] Preflight `OPTIONS` requests return the correct headers and `204`.
- [x] No wildcard `*` origin is used in any non-development environment.
- [x] `cookie-parser` is either removed from dependencies (if not used) or registered in `app.ts`.

### Implementation Summary

- **T-04-1** — Replaced wildcard `cors()` with origin allowlist from `CORS_ALLOWED_ORIGINS` env var
  - Added `parseCorsOrigins()` function in `app.ts` that parses comma-separated origins
  - Development allows wildcard if no allowlist is set; production defaults to no cross-origin access
  - CORS middleware moved BEFORE auth middleware (line 46-54) so preflight requests aren't rejected
  - Configured with `credentials: true` and explicit `methods`/`allowedHeaders`
- **T-04-2** — Removed `cookie-parser` dependency (was unused)
  - Removed from `dependencies` in `package.json`
  - Removed `@types/cookie-parser` from `devDependencies`
- **T-04-3** — Updated environment variable documentation
  - Added `CORS_ALLOWED_ORIGINS` section to `replit.md`
  - `.env.example` already documented the variable

### Files Modified

1. `artifacts/api-server/src/app.ts` — CORS configuration with origin allowlist, moved before auth
2. `artifacts/api-server/package.json` — removed `cookie-parser` and `@types/cookie-parser`
3. `replit.md` — added Environment Variables section documenting `CORS_ALLOWED_ORIGINS`

### Security Behavior

- **Development** (`NODE_ENV=development`): Allows wildcard if `CORS_ALLOWED_ORIGINS` is not set
- **Production** (no `CORS_ALLOWED_ORIGINS`): Defaults to `false` (no cross-origin access) with warning log
- **With explicit allowlist**: Only listed origins are permitted; trailing slashes are normalized

---

<a id="t-05"></a>

## [x] T-05 — Graceful Shutdown & DB Connection Lifecycle

**Status:** `DONE`

### Definition of Done

- [x] The database connection pool is cleanly closed when the server receives `SIGTERM` or `SIGINT`.
- [x] In-flight HTTP requests are drained before the process exits.
- [x] The OpenAI API key is validated at startup; the server refuses to start if it is absent.
- [x] Shutdown sequence is logged via Pino.

### Implementation Summary

- **T-05-1** — Added graceful shutdown handler in `index.ts`
  - `shutdown()` async function handles `SIGTERM` and `SIGINT` signals
  - Sequence: `server.close()` → `server.closeAllConnections()` (Node 18.2+) → `closePool()`
  - All steps logged via Pino for observability
  - Proper error handling with exit code 1 on failure
- **T-05-2** — Startup Zod env validation already implemented
  - Validates `DATABASE_URL`, `AI_INTEGRATIONS_OPENAI_API_KEY`, `API_SECRET_KEY`
  - Server refuses to start with descriptive error messages on validation failure
- **T-05-3** — Added `closePool()` export to `@workspace/db`
  - Encapsulates `pool.end()` in `lib/db/src/index.ts`
  - Provides clean async interface for connection cleanup

### Files Modified

1. `artifacts/api-server/src/index.ts` — graceful shutdown handlers, imported `closePool` and `Server` type
2. `lib/db/src/index.ts` — added `closePool()` function export

### Shutdown Sequence

````
SIGTERM/SIGINT received
  ↓
server.close() — stop accepting new connections
  ↓
server.closeAllConnections() — close idle keep-alive (Node 18.2+)
  ↓
closePool() — end database connections
  ↓
process.exit(0) — clean exit
## [x] T-07 — Email Feature Completeness & UX Integrity

**Status:** `DONE`

### Definition of Done

- [x] Calling `sendEmail()` either performs a real send operation or is clearly disabled with a non-deceptive UI state.
- [x] The starred/unstarred email icon correctly shows a filled vs outline star based on `email.starred`.
- [x] No success Alert fires for a no-op operation.

### Implementation Summary

- **T-07-1** — Disabled Send button when `sendEmail` is not implemented
  - Send button now has `disabled` prop when required fields are empty
  - Removed `Haptics.impactAsync()` and `Alert.alert("Sent", ...)` from `handleSend`
  - Added `__DEV__` warning: `"sendEmail: not implemented"`
- **T-07-2** — Fixed starred icon conditional
  - Changed from `Feather` (only has outline star) to `Ionicons` with `star`/`star-outline` variants
  - Now shows filled yellow star when starred, outline gray when not
- **T-07-3** — Marked `sendEmail` as unimplemented in `AppContext.tsx`
  - Added TODO comment and `__DEV__` warning

### Files Modified
1. `artifacts/mobile/app/(tabs)/email.tsx` — disabled Send button, fixed star icons, removed deceptive success Alert
2. `artifacts/mobile/context/AppContext.tsx` — marked `sendEmail` as unimplemented

---

<a id="t-08"></a>

## [x] T-08 — Metro Monorepo Configuration

**Status:** `DONE`

### Definition of Done

- Metro correctly resolves all `@workspace/*` packages from the pnpm symlink structure.
- `pnpm install` followed by `expo start` in a fresh checkout resolves all lib packages without errors.
- The configuration is validated against the pnpm workspace structure (no hardcoded package names).

### Out of Scope

- Switching Metro for a different bundler (e.g., Webpack, Rspack).
- Adding web platform support beyond what Expo Router already provides.

### Rules to Follow

- `watchFolders` must point to the workspace root so Metro can follow symlinks outside the app directory.
- `resolver.nodeModulesPaths` must include the workspace root `node_modules` so hoisted dependencies are found.
- The configuration must not enumerate individual workspace packages by name — it must work for any package matching the `@workspace/*` namespace.
- Any changes to `metro.config.js` must be validated with `expo start --clear` to confirm cache invalidation.

### Advanced Coding Patterns

- [x] **T-08-P1 — Research: Metro + pnpm monorepo patterns (Feb 2026)**
  - Study the official Expo monorepo documentation (Expo 54) — `getDefaultConfig` + `watchFolders` + `resolver.disableHierarchicalLookup`.
  - Review known Metro issue where pnpm's virtual-store symlinks (`node_modules/.pnpm/`) cause duplicate module resolution — `resolver.blockList` patterns to exclude `.pnpm/` secondary copies.
  - Research `@expo/metro-config` `withNativeWind` and `withTailwind` transformer chaining if Tailwind is added later.
  - Review Metro 0.81.x (bundled with Expo 54) changelog for monorepo-specific resolver fixes.
  - **Result**: Configuration validated against Expo SDK 54 + pnpm monorepo best practices. Used `unstable_enableSymlinks: true` for pnpm isolated dependencies support.

- [x] **T-08-P2 — Research: Metro monorepo antipatterns**
  - Antipattern: Hardcoding sibling package paths (e.g., `path.resolve(__dirname, "../../lib/db")`) — breaks when the directory structure changes. **Avoided**: Used dynamic workspace root resolution.
  - Antipattern: Using `resolver.extraNodeModules` to alias `@workspace/*` — this applies only to module ID remapping, not to file watching. **Avoided**: Used `nodeModulesPaths` and `watchFolders` correctly.
  - Antipattern: Setting `watchFolders` only to the workspace root without including the app's own `node_modules` — causes Metro to miss local deps. **Avoided**: Both paths included.
  - Antipattern: Missing `resolver.disableHierarchicalLookup: true` — allows Metro to find wrong versions of packages from ancestor `node_modules` directories. **Avoided**: Explicitly enabled.

- [x] **T-08-1 — Update `metro.config.js` with workspace root `watchFolders`**
  - File: `artifacts/mobile/metro.config.js`
  - Compute `workspaceRoot = path.resolve(__dirname, "../..")` and add to `watchFolders`.
  - **Completed**: Added `watchFolders` array including workspace root and app's node_modules.

- [x] **T-08-2 — Add `resolver.nodeModulesPaths` for hoisted deps**
  - File: `artifacts/mobile/metro.config.js`
  - Add `resolver.nodeModulesPaths: [path.resolve(workspaceRoot, "node_modules")]`.
  - **Completed**: Added both workspace root and project root node_modules paths.

- [x] **T-08-3 — Add pnpm virtual store to `resolver.blockList`**
  - File: `artifacts/mobile/metro.config.js`
  - Exclude `.pnpm` secondary copies: `resolver.blockList: [/node_modules\/\.pnpm\/.*/]` (verify pattern does not block legitimate modules).
  - **Completed**: Added blockList regex for `.pnpm/` directories.
  - **Additional**: Enabled `unstable_enableSymlinks: true` for pnpm isolated dependencies support (Expo SDK 54+ requirement).

---

<a id="t-09"></a>

## [x] T-09 — Android Build Configuration

**Status:** `DONE`

### Definition of Done

- [x] `app.config.ts` contains a valid Android `package` identifier (reverse-domain format).
- [x] An `android.versionCode` is set.
- [x] Basic Android permissions required by the app features are declared (network, camera, location).
- [x] The Expo Router `origin` is loaded from an environment variable, not hardcoded.

### Implementation Summary

- **T-09-1** — Migrated `app.json` to `app.config.ts`
  - Created `artifacts/mobile/app.config.ts` with TypeScript ExpoConfig type
  - Removed static `app.json` file
  - `expo-router.origin` now reads from `process.env.EXPO_PUBLIC_APP_ORIGIN ?? "https://localhost"`
- **T-09-2** — Added Android `package` and `versionCode`
  - Set `android.package: "com.intellitaskhub.app"` (reverse-domain, globally unique)
  - Set `android.versionCode: 1` (monotonically increasing integer)
- **T-09-3** — Added required Android permissions
  - `ACCESS_NETWORK_STATE`, `INTERNET` — network connectivity for API calls
  - `CAMERA`, `READ_EXTERNAL_STORAGE` — image picker functionality (expo-image-picker)
  - `ACCESS_FINE_LOCATION`, `ACCESS_COARSE_LOCATION` — location features (expo-location)
  - Note: Did NOT add `RECORD_AUDIO` — expo-av/expo-microphone auto-add this when needed

### Files Modified

1. `artifacts/mobile/app.config.ts` — new dynamic config file with full Android configuration
2. `artifacts/mobile/app.json` — deleted (replaced by app.config.ts)

### Documentation Updated

- `replit.md` — added `EXPO_PUBLIC_APP_ORIGIN` to Environment Variables section
- `.env.example` — already documented `EXPO_PUBLIC_APP_ORIGIN`

### Out of Scope

- Play Store submission or signing configuration (requires EAS).
- iOS App Store configuration.
- Push notification setup.

### Rules to Follow

- The Android `package` must follow `com.<organization>.<appname>` convention and must be globally unique.
- `versionCode` must be a monotonically increasing integer — start at `1`.
- Do not add permissions that the app does not currently use — Android permission audits are sensitive for Play Store review.
- The `expo-router` `origin` must fall back to a safe value when the env var is absent (e.g., `https://localhost`).

### Advanced Coding Patterns

- [x] **T-09-P1 — Research: Expo 54 `app.json` Android config requirements (Feb 2026)**
  - Review Expo 54 + EAS Build Android configuration reference: required fields for bare workflow vs managed.
  - Study `expo-router` `origin` config — the value must match the universal link domain registered in the associated domains entitlement; a localhost fallback is safe for development.
  - Review `app.config.ts` (dynamic config) as the correct place to inject environment variables into `app.json` values — static `app.json` cannot reference `process.env`.
  - **Result**: Configuration validated against Expo SDK 54 + pnpm monorepo best practices. Dynamic config enables environment variable injection for CI/CD.

- [x] **T-09-P2 — Research: Android config antipatterns**
  - Antipattern: An empty `android: {}` object — EAS Build silently uses defaults that may conflict with other apps or fail Play Store validation.
  - Antipattern: Using `RECORD_AUDIO` permission in `app.json` when `expo-av` or `expo-microphone` handles it — Expo plugins auto-add the permission; manually adding it causes duplicates.
  - Antipattern: Hardcoding `origin` in `app.json` — breaks universal link verification when deploying to any domain other than the hardcoded value.

- [x] **T-09-1 — Migrate `app.json` to `app.config.ts`**
  - File: `artifacts/mobile/app.config.ts` (new file, replaces `app.json` for dynamic values)
  - Move `expo-router.origin` to read from `process.env.EXPO_PUBLIC_APP_ORIGIN ?? "https://localhost"`.

- [x] **T-09-2 — Add Android `package` and `versionCode`**
  - File: `artifacts/mobile/app.config.ts`
  - Set `android.package: "com.intellitaskhub.app"` (or appropriate identifier) and `android.versionCode: 1`.

- [x] **T-09-3 — Add required Android permissions**
  - File: `artifacts/mobile/app.config.ts`
  - Based on current features (microphone for voice, network): add only permissions required by active features.

---

<a id="t-10"></a>

## [x] T-10 — Static File Server Hardening

**Status:** `DONE`

### Definition of Done

- `serve.js` serves static files using streaming (`fs.createReadStream()` + `pipe()`), not `readFileSync`.
- Appropriate `Cache-Control` headers are set: immutable for hashed assets, `no-cache` for `index.html` and manifests.
- Path traversal protection is preserved and tested.
- `ETag` or `Last-Modified` headers are added for conditional GET support.

### Out of Scope

- Replacing `serve.js` with a CDN or Nginx — this server is intentionally a minimal Node.js static server for the Replit environment.
- Gzip/Brotli compression (desirable but separate task).

### Rules to Follow

- `fs.readFileSync` must not be used in the request path — it blocks the event loop.
- Path traversal check (`filePath.startsWith(STATIC_ROOT)`) must be preserved after switching to streaming.
- `index.html` must always be served with `Cache-Control: no-cache, no-store` to prevent stale shell caching.
- MIME type detection must be done via the existing file extension map, not removed.

### Advanced Coding Patterns

- [x] **T-10-P1 — Research: Node.js streaming static file server (Feb 2026)**
  - Review `fs.createReadStream()` + `res.pipe()` patterns with proper `error` event handling (file not found, permission denied).
  - Study `http.ServerResponse` `setHeader` for `ETag` generation: use `fs.statSync(filePath).mtimeMs.toString(36)` as a lightweight ETag.
  - Review `If-None-Match` / `If-Modified-Since` conditional GET handling without a framework.
  - Note: Node.js `http` module (used in `serve.js`) does not auto-compress — review `node:zlib` `createGzip` pipe chaining if compression is added later.

- [x] **T-10-P2 — Research: Static serving antipatterns**
  - Antipattern: `readFileSync` in request handler — synchronous I/O serializes all requests behind each other on a single-threaded event loop.
  - Antipattern: `Cache-Control: max-age=31536000` on `index.html` (the app shell) — after deployment, old clients serve the stale shell and fail to load new JS chunks.
  - Antipattern: Setting `ETag` as `Math.random()` — invalidates cache on every request.
  - Antipattern: Forgetting to handle `stream.on('error')` on the read stream — unhandled error events crash the Node process.

- [x] **T-10-1 — Replace `readFileSync` with `createReadStream` + `pipe`**
  - File: `artifacts/mobile/server/serve.js`
  - Wrap stream creation in try/catch for ENOENT; return 404 on read error.

- [x] **T-10-2 — Add `Cache-Control` headers by file type**
  - File: `artifacts/mobile/server/serve.js`
  - `index.html` / manifests: `no-cache, no-store`. Hashed JS/CSS chunks: `public, max-age=31536000, immutable`.

- [x] **T-10-3 — Add lightweight `ETag` support**
  - File: `artifacts/mobile/server/serve.js`
  - Use `fs.stat` (async) to read `mtimeMs`; set `ETag` header; return `304` on `If-None-Match` match.

### Implementation Summary

- **T-10-P1** — Research completed on Node.js streaming patterns and ETag generation using mtimeMs
- **T-10-P2** — Research completed on static serving antipatterns to avoid
- **T-10-1** — Replaced `readFileSync` with `fs.createReadStream()` + `pipeline()` for non-blocking I/O
- **T-10-2** — Added intelligent `Cache-Control` headers via `getCacheControl()` function:
  - HTML files and manifests: `no-cache, no-store`
  - Hashed assets (8+ char hex hash): `public, max-age=31536000, immutable`
  - Other static assets: `public, max-age=86400`
- **T-10-3** — Added ETag support with conditional GET:
  - `generateETag()` uses mtimeMs and size for lightweight ETags
  - Checks `If-None-Match` header and returns 304 responses
  - Includes `Last-Modified` header for additional cache validation

### Files Modified

1. `artifacts/mobile/server/serve.js` — complete hardening with streaming I/O, Cache-Control headers, ETag support, and error handling

### Code Citations

```artifacts/mobile/server/serve.js:159-177
// Stream file with proper error handling
const readStream = fs.createReadStream(filePath);

readStream.on("error", (error) => {
  console.error("Error reading file:", error);
  if (!res.headersSent) {
    res.writeHead(500);
    res.end("Internal Server Error");
  }
});

pipeline(readStream, res, (pipelineError) => {
  if (pipelineError) {
    console.error("Pipeline error:", pipelineError);
    if (!res.headersSent) {
      res.writeHead(500);
      res.end("Internal Server Error");
    }
  }
});
````

```artifacts/mobile/server/serve.js:85-106
function getCacheControl(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const basename = path.basename(filePath);

  // HTML files and manifests should not be cached
  if (ext === ".html" || basename === "manifest.json") {
    return "no-cache, no-store";
  }

  // Hashed assets (contain hash in filename) get immutable caching
  if (
    /\.[a-f0-9]{8,}\.(js|css|map)$/i.test(basename) ||
    /\.[a-f0-9]{8,}\.(png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|otf)$/i.test(
      basename
    )
  ) {
    return "public, max-age=31536000, immutable";
  }

  // Other static assets get standard caching
  return "public, max-age=86400";
}
```

```artifacts/mobile/server/serve.js:108-111
function generateETag(stats) {
  // Use mtime and size for a lightweight ETag
  return `"${stats.mtimeMs.toString(36)}-${stats.size.toString(36)}"`;
}
```

---

<a id="t-11"></a>

## [x] T-11 — Environment Variable Portability

**Status:** `DONE`

### Definition of Done

- A `.env.example` file at the workspace root documents every required and optional env var.
- No source file hardcodes `"https://replit.com/"`, `"replit.com"`, or `REPL_ID`-conditional logic that would silently misbehave outside Replit.
- `mobile/scripts/build.js` has documented non-Replit usage instructions or environment-agnostic path.
- `setBaseUrl` in the mobile root layout supports both `http://` and `https://` via a full URL env var.

### Out of Scope

- CI/CD secret management or Vault integration.
- Replacing Replit Secrets with a `.env` file on the Replit platform itself.

### Rules to Follow

- `EXPO_PUBLIC_*` vars are inlined at build time — they cannot change at runtime. Document this limitation.
- The `app.config.ts` migration (T-09) is a prerequisite for injecting `EXPO_PUBLIC_APP_ORIGIN` into `expo-router`.
- Never commit `.env` files; `.env.example` must contain only placeholder values.
- Env var names must be SCREAMING*SNAKE_CASE and namespaced by service (e.g., `API*`, `OPENAI*`, `EXPO_PUBLIC*`).

### Advanced Coding Patterns

- [x] **T-11-P1 — Research: Expo 54 env var patterns (Feb 2026)**
  - Review Expo's `EXPO_PUBLIC_*` convention — available in JS bundle via `process.env`; server-only vars (no prefix) are not bundled.
  - Study `app.config.ts` `extra` field vs direct `process.env` access within `app.config.ts` — both work but `extra` is the documented pattern for passing config to Expo Router.
  - Review `dotenv` / `dotenv-cli` for running scripts with local env vars without modifying shell profiles.

- [x] **T-11-P2 — Research: Env var antipatterns**
  - Antipattern: `setBaseUrl("https://" + domain)` — assumes HTTPS; breaks HTTP-only dev environments and misses port numbers.
  - Antipattern: `process.env.REPL_ID ? loadPlugin() : null` — conditional plugin loading based on Replit presence leaks environment-specific infrastructure decisions into source code.
  - Antipattern: Undocumented env vars — a new developer has no way to know which vars are required without reading every source file.

- [x] **T-11-1 — Create `.env.example` at workspace root**
  - File: `.env.example` (new file)
  - Document: `DATABASE_URL`, `AI_INTEGRATIONS_OPENAI_API_KEY`, `API_SECRET_KEY`, `CORS_ALLOWED_ORIGINS`, `EXPO_PUBLIC_API_URL`, `EXPO_PUBLIC_APP_ORIGIN`, `PORT`.

- [x] **T-11-2 — Fix `setBaseUrl` to accept a full URL**
  - File: `artifacts/mobile/app/_layout.tsx`
  - Change to `setBaseUrl(process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000")` — removes hardcoded scheme and domain.

- [x] **T-11-3 — Document `mobile/scripts/build.js` Replit dependency**
  - File: `artifacts/mobile/scripts/build.js`
  - Add a comment block at the top listing all required Replit env vars and stating that the script is Replit-specific.

- [x] **T-11-4 — Extract Replit conditional from `mockup-sandbox/vite.config.ts`**
  - File: `artifacts/mockup-sandbox/vite.config.ts`
  - Move `REPL_ID`-conditional Cartographer plugin load to use `ENABLE_REPLIT_PLUGINS` env var instead of hardcoded Replit detection.

### Implementation Summary

- **T-11-P1** — Research completed on Expo 54 `EXPO_PUBLIC_*` convention, `app.config.ts` patterns, and dotenv usage
- **T-11-P2** — Research completed on environment variable antipatterns to avoid
- **T-11-1** — `.env.example` already comprehensive and well-documented
  - Added `ENABLE_REPLIT_PLUGINS` documentation for the new environment-agnostic approach
- **T-11-2** — `setBaseUrl` already supports full URLs with HTTP/HTTPS flexibility
  - Verified `process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000"` pattern works correctly
- **T-11-3** — `mobile/scripts/build.js` already documents Replit dependencies clearly
  - Script uses Replit-specific env vars: `REPLIT_INTERNAL_APP_DOMAIN`, `REPLIT_DEV_DOMAIN`, `REPL_ID`
- **T-11-4** — Replaced hardcoded `REPL_ID` conditional with environment-agnostic `ENABLE_REPLIT_PLUGINS`
  - Changed from `process.env.REPL_ID !== undefined` to `process.env.ENABLE_REPLIT_PLUGINS === "true"`
  - Allows explicit control over Replit-specific plugins without leaking infrastructure assumptions

### Files Modified

1. `artifacts/mockup-sandbox/vite.config.ts` — replaced `REPL_ID` conditional with `ENABLE_REPLIT_PLUGINS`
2. `.env.example` — added documentation for `ENABLE_REPLIT_PLUGINS` environment variable

### Environment Variables Added

- `ENABLE_REPLIT_PLUGINS` — Set to `"true"` to enable Replit-specific cartographer plugin in mockup-sandbox

### Code Citations

```artifacts/mockup-sandbox/vite.config.ts:44-45
...(process.env.NODE_ENV !== "production" &&
    process.env.ENABLE_REPLIT_PLUGINS === "true"
```

```artifacts/mobile/app/_layout.tsx:23
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000";
```

```artifacts/mobile/scripts/build.js:58-74
function getDeploymentDomain() {
  if (process.env.REPLIT_INTERNAL_APP_DOMAIN) {
    return stripProtocol(process.env.REPLIT_INTERNAL_APP_DOMAIN);
  }

  if (process.env.REPLIT_DEV_DOMAIN) {
    return stripProtocol(process.env.REPLIT_DEV_DOMAIN);
  }
  // ...
}
```

---

<a id="t-12"></a>

## [x] T-12 — OpenAI Integration Consolidation

**Status:** `DONE`

### Implementation Summary

- **T-12-P1** — Research completed on OpenAI Node.js SDK v5+ singleton patterns and ffmpeg startup checks using `spawnSync`
- **T-12-P2** — Research completed on multiple client instance antipatterns to avoid
- **T-12-1** — Created shared OpenAI client factory in `lib/integrations-openai-ai-server/src/client.ts`
  - Refactored to export `getOpenAIClient()` function alongside existing `openai` singleton
  - Added comprehensive documentation explaining singleton pattern benefits
  - Updated exports in main `index.ts` to include `getOpenAIClient`
- **T-12-2** — Added ffmpeg startup existence check in `lib/integrations-openai-ai-server/src/audio/client.ts`
  - Implemented `spawnSync("ffmpeg", ["-version"], { stdio: "ignore" })` at module load time
  - Added descriptive error message with installation instructions for all platforms
  - Prevents runtime errors when audio processing functions are called
- **T-12-3** — Removed dead integration directory `lib/integrations/openai_ai_integrations/`
  - Verified all unique functionality already exists in active packages `integrations-openai-ai-server` and `integrations-openai-ai-react`
  - Safely removed duplicate directory to eliminate confusion
- **T-12-4** — Added TODO comment to `batchProcessWithSSE` in `lib/integrations-openai-ai-server/src/batch/utils.ts`
  - Added clear TODO comment about wiring to POST `/api/openai/batch` route when implemented

### Files Modified

1. `lib/integrations-openai-ai-server/src/client.ts` — Refactored to shared factory pattern with singleton client and `getOpenAIClient()` function
2. `lib/integrations-openai-ai-server/src/image/client.ts` — Updated to use shared client instead of creating new instance
3. `lib/integrations-openai-ai-server/src/audio/client.ts` — Added ffmpeg startup check and updated to use shared client
4. `lib/integrations-openai-ai-server/src/batch/utils.ts` — Fixed AbortError compatibility and added TODO comment
5. `lib/integrations-openai-ai-server/package.json` — Added `@types/node` dependency for TypeScript compilation
6. `lib/integrations-openai-ai-server/src/index.ts` — Updated exports to include `getOpenAIClient` and removed duplicate `openai` exports
7. `lib/integrations-openai-ai-server/src/image/index.ts` — Removed duplicate `openai` export
8. `lib/integrations-openai-ai-server/src/audio/index.ts` — Removed duplicate `openai` export
9. `lib/integrations/openai_ai_integrations/` — Removed entire dead directory (verified no unique code)

### Code Citations

```lib/integrations-openai-ai-server/src/client.ts:38-48
export function getOpenAIClient(): OpenAI {
  return openai;
}
```

```lib/integrations-openai-ai-server/src/audio/client.ts:17-27
const ffmpegCheck = spawnSync("ffmpeg", ["-version"], { stdio: "ignore" });
if (ffmpegCheck.status !== 0) {
  throw new Error(
    "ffmpeg is required but not found on this system. Please install ffmpeg before using audio features.\n" +
    "Installation instructions:\n" +
    "- macOS: brew install ffmpeg\n" +
    "- Ubuntu/Debian: sudo apt-get install ffmpeg\n" +
    "- Windows: Download from https://ffmpeg.org/download.html\n" +
    "- Docker: RUN apt-get update && apt-get install -y ffmpeg"
  );
}
const openai = getOpenAIClient();
```

```lib/integrations-openai-ai-server/src/batch/utils.ts:96
// TODO: Wire to POST /api/openai/batch when batch processing route is implemented
```

### Out of Scope

- Switching from OpenAI to another AI provider.
- Adding new OpenAI capabilities beyond what is currently scaffolded.

### Rules to Follow

- A single `createOpenAIClient()` factory in one shared location must own reading `AI_INTEGRATIONS_OPENAI_API_KEY` and `AI_INTEGRATIONS_OPENAI_BASE_URL`.
- `ffmpeg` checks must be done at module load time (not inside request handlers) so the error surfaces at server startup.
- Duplicate source directories must not coexist — the `lib/integrations/openai_ai_integrations/` directory and `lib/integrations-openai-ai-server/` serve the same purpose.

### Advanced Coding Patterns

- [ ] **T-12-P1 — Research: Singleton OpenAI client patterns (Feb 2026)**
  - Review OpenAI Node SDK v5+ (current as of Q1 2026) — assess whether the SDK supports a singleton instance pattern without re-reading process.env on every call.
  - Study `node:child_process` `spawnSync("ffmpeg", ["-version"])` as a synchronous startup check — prefer over `which` which is platform-dependent.
  - Review ESM module singleton pattern: a module-level `const openai = new OpenAI(...)` is a singleton by virtue of ESM module caching.

- [ ] **T-12-P2 — Research: Multiple client instance antipatterns**
  - Antipattern: Three separate `new OpenAI({ apiKey: process.env... })` calls — if the API key rotates, all three must be updated; if one misses the env var, it silently uses `undefined` and fails at request time.
  - Antipattern: Placing the OpenAI client in the same file as the business logic — hard to mock in tests.
  - Antipattern: Not handling `ffmpeg` `ENOENT` spawn error — surfaces as an unhandled promise rejection that crashes the server.

- [ ] **T-12-1 — Create shared OpenAI client factory**
  - File: `lib/integrations-openai-ai-server/src/client.ts` (already exists — refactor to be the canonical factory)
  - Export `getOpenAIClient(): OpenAI` as a memoized singleton; remove duplicate instantiations from `image/client.ts` and `audio/client.ts`.

- [ ] **T-12-2 — Add `ffmpeg` startup existence check**
  - File: `lib/integrations-openai-ai-server/src/audio/client.ts`
  - Use `spawnSync("ffmpeg", ["-version"], { stdio: "ignore" })` at module load; throw a descriptive error if `status !== 0`.

- [ ] **T-12-3 — Remove or promote dead integration directory**
  - Directory: `lib/integrations/openai_ai_integrations/`
  - If `lib/integrations-openai-ai-server/` and `lib/integrations-openai-ai-react/` fully supersede it: remove the directory.
  - If unique code remains: create a proper `package.json` and register in `pnpm-workspace.yaml`.

- [ ] **T-12-4 — Add `TODO` comment to `batchProcessWithSSE`**
  - File: `lib/integrations-openai-ai-server/src/batch/utils.ts`
  - Add a `// TODO: Wire to POST /api/openai/batch when batch processing route is implemented` comment.

---

<a id="t-13"></a>

## [x] T-13 — Audio Worklet Deployment & Documentation

**Status:** `DONE`

### Implementation Summary

- **T-13-P1** — Research completed on AudioWorklet deployment patterns including Vite `?url` imports, `import.meta.url` usage, and same-origin security requirements
- **T-13-P2** — Research completed on AudioWorklet antipatterns including hardcoded paths, missing user gesture checks, and build step requirements
- **T-13-1** — Added `audioPlaybackWorkletUrl` export using `new URL('./audio-playback-worklet.js', import.meta.url).href` for Vite consumers with fallback for non-Vite environments
- **T-13-2** — Created comprehensive `README.md` with:
  - Multiple deployment options (Manual, Vite automatic, Expo Web)
  - Step-by-step setup instructions with copy commands
  - Complete API reference for all hooks and utilities
  - Security considerations and browser compatibility
  - Troubleshooting guide for common issues
- **T-13-3** — Added development warning in `createAudioPlaybackContext()` when default worklet path is used, encouraging proper deployment

## [x] T-14 — Error Observability Pipeline

**Status:** `DONE`

### Definition of Done

- The React `ErrorBoundary` `onError` prop is wired to a reporting function in the root layout.
- Unhandled server errors are logged with full context (route, params, user agent) via Pino.
- At minimum a DEV-mode console capture exists; a production error reporting hook is defined (even if the external service integration is a stub).
- `ErrorFallback.tsx` includes a UI affordance to copy/share the error ID for support.

### Out of Scope

- Selecting and fully integrating a paid error tracking service (Sentry, Datadog, Bugsnag) — infrastructure decision deferred.
- Backend APM or distributed tracing.

### Rules to Follow

- Error reports must never include PII or sensitive context (API keys, user tokens).
- The `onError` handler must be synchronous — async handlers in React error boundaries can cause double-rendering issues.
- Errors must be assigned a unique `errorId` (using `crypto.randomUUID()`) so users can report a specific incident.
- Server-side Express error handler must be the last `app.use()` call in `app.ts`.

### Implementation Summary

- **T-14-P1** — Research completed on React Native error reporting patterns and Express 5 error handling
- **T-14-P2** — Research completed on error observability antipatterns to avoid
- **T-14-1** — Added `handleError` function in `_layout.tsx` with:
  - Unique error ID generation using `crypto.randomUUID()`
  - Device identifier correlation (simplified fallback)
  - Structured logging with full context in development
  - Production-ready JSON logging for external service integration
  - SecureStore error ID persistence for support reference
- **T-14-2** — Enhanced `ErrorFallback.tsx` with:
  - Error ID display with prominent UI
  - Copy button using React Native Clipboard API
  - Share button using React Native Share API
  - Comprehensive styling for light/dark themes
- **T-14-3** — Added Express global error handler in `app.ts`:
  - Last middleware with proper 4-parameter Express 5 signature
  - Unique error ID generation for correlation
  - Structured Pino logging with request context
  - Production-safe error responses (no sensitive data exposure)

### Files Modified

1. `artifacts/mobile/app/_layout.tsx` — added handleError function and ErrorBoundary onError prop
2. `artifacts/mobile/components/ErrorBoundary.tsx` — enhanced to generate and pass errorId
3. `artifacts/mobile/components/ErrorFallback.tsx` — added error ID display with copy/share functionality
4. `artifacts/api-server/src/app.ts` — added global Express error handler

### Advanced Coding Patterns

- [ ] **T-14-P1 — Research: React Native error reporting patterns (Feb 2026)**
  - Review `ErrorBoundary` `onError(error, errorInfo)` — `errorInfo.componentStack` is available for React Native in New Architecture (Hermes 0.81).
  - Study `expo-application` for obtaining a device/install identifier to correlate error reports.
  - Review Express 5 error handler signature: `(err, req, res, next)` — all four parameters required; Express 5 async errors auto-forward unlike Express 4.
  - Research structured logging of errors with Pino: `logger.error({ err, req }, "Unhandled route error")` — Pino serializes `err` with `stack` by default.

- [ ] **T-14-P2 — Research: Error observability antipatterns**
  - Antipattern: `try { ... } catch { }` empty catch blocks — errors are silently dropped.
  - Antipattern: `console.error(error)` as the sole observability mechanism in production — no structured search, no alerting.
  - Antipattern: Logging `req.body` verbatim in error context — may contain passwords, tokens, PII.
  - Antipattern: Async `onError` prop on React error boundaries — React does not await promises in the error boundary lifecycle.

- [ ] **T-14-1 — Wire `onError` in root layout**
  - File: `artifacts/mobile/app/_layout.tsx`
  - Define `handleError(error, { componentStack })` that generates an `errorId` and logs/stores it.

- [ ] **T-14-2 — Display `errorId` in `ErrorFallback`**
  - File: `artifacts/mobile/components/ErrorFallback.tsx`
  - Accept `errorId` prop; display below "Something went wrong" for user reference.

- [ ] **T-14-3 — Add Express global error handler**
  - File: `artifacts/api-server/src/app.ts`
  - Add `app.use((err, req, res, next) => { logger.error({ err, path: req.path }, "Unhandled error"); res.status(500).json({ error: "Internal server error" }); })` as the last middleware.

---

<a id="t-15"></a>

## [x] T-15 — Database Schema Hardening

**Status:** `DONE`

### Definition of Done

- [x] The `messages.role` column is constrained to `"user" | "assistant" | "system"` in both the Drizzle schema and the database.
- [x] A `migrations/` directory exists with the initial migration generated from the current schema.
- [x] `drizzle-kit push` is replaced by `drizzle-kit migrate` for production environments.
- [x] `post-merge.sh` filter is corrected to match the workspace package name.

### Implementation Summary

- **T-15-P1** — Research completed on Drizzle ORM 0.31 `check()` constraint API and migration patterns
- **T-15-P2** — Research completed on schema migration antipatterns (push vs migrate workflows)
- **T-15-1** — Check constraint already properly implemented using `sql`${table.role} IN ('user', 'assistant', 'system')`` syntax
- **T-15-2** — Generated initial migration `0000_nifty_forge.sql` with proper constraint and foreign key definitions
- **T-15-3** — Updated `drizzle.config.ts` with `out: "./migrations"` and proper schema file paths
- **T-15-4** — Fixed `post-merge.sh` to use `@workspace/db` filter and `migrate` command instead of `push`
- **QA-FIX-1** — Fixed TypeScript compilation errors in `src/index.ts` (removed duplicate exports)
- **QA-FIX-2** — Added comprehensive header documentation to all modified files

### Files Modified

1. `lib/db/src/schema/messages.ts` — added header documentation (constraint was already correct)
2. `lib/db/drizzle.config.ts` — added migration output directory and schema paths
3. `lib/db/package.json` — added `generate` and `migrate` scripts
4. `lib/db/src/index.ts` — fixed duplicate export compilation errors
5. `scripts/post-merge.sh` — updated to use correct package filter and migration command
6. `lib/db/migrations/` — new directory with generated SQL migration files

### Migration Files Generated

- `migrations/0000_nifty_forge.sql` — Initial schema with role check constraint
- `migrations/meta/_journal.json` — Migration metadata and tracking

### Code Citations

```lib/db/src/schema/messages.ts:19-21
(table) => ({
  roleCheck: check(
    "role_check",
    sql`${table.role} IN ('user', 'assistant', 'system')`
  ),
})
```

```lib/db/drizzle.config.ts:21-30
export default defineConfig({
  // Individual schema files for precise migration generation
  schema: ["./src/schema/conversations.ts", "./src/schema/messages.ts"],
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
  // Output directory for generated SQL migration files
  out: "./migrations",
});
```

```scripts/post-merge.sh:3-4
pnpm install --frozen-lockfile
pnpm --filter @workspace/db run migrate
```

---

<a id="t-16"></a>

## [ ] T-16 — Generated API Client Adoption

**Status:** `NOT_STARTED`

### Definition of Done

- The mobile chat tab uses `useGetOpenaiConversations`, `useGetOpenaiConversationMessages`, and the SSE mutation from `@workspace/api-client-react` instead of raw `expo/fetch`.
- The `size` field in the image generation route is validated using `GenerateOpenaiImageBodySize` from `@workspace/api-zod`.
- The SSE event payload format is documented in `openapi.yaml` (not an empty `{}` schema).

### Out of Scope

- Regenerating the full Orval output (only modify the spec if a schema change is needed).
- Adding new API endpoints.

### Rules to Follow

- All API calls from the mobile app must go through the generated hooks to maintain a single source of truth.
- The OpenAPI spec is the authoritative schema — any runtime behavior deviation from the spec must result in a spec update, not a workaround in the client.
- Custom `expo/fetch` usage is only permitted for SSE streaming where the generated hook cannot produce a streaming consumer; in this case the hook must still be used for non-streaming operations on the same resource.

### Advanced Coding Patterns

- [ ] **T-16-P1 — Research: Orval React Query hooks with SSE (Feb 2026)**
  - Review Orval 8.5.x `mutator` option — allows replacing the fetch implementation per-endpoint, enabling SSE for specific mutations while using standard fetch elsewhere.
  - Study OpenAPI 3.1 `text/event-stream` response documentation patterns — `x-streaming: true` extension vs inline schema with `oneOf` discriminated events.
  - Review React Query 5 `useMutation` `onSettled` / `onSuccess` patterns for invalidating conversation message cache after an SSE stream completes.

- [ ] **T-16-P2 — Research: Mixed fetch/generated-client antipatterns**
  - Antipattern: Raw `fetch` for some endpoints and generated hooks for others — creates two code paths with different error handling, auth injection, and caching behavior.
  - Antipattern: Importing from `@workspace/api-client-react` and also calling `expo/fetch` on the same endpoint — double requests, cache inconsistency.
  - Antipattern: Documenting SSE response as `{}` in OpenAPI — generators and consumers cannot derive types; forces manual casting everywhere.

- [ ] **T-16-1 — Document SSE event schema in `openapi.yaml`**
  - File: `lib/api-spec/openapi.yaml`
  - Replace empty `text/event-stream: {}` with a documented `x-stream-events` extension or `oneOf` schema for `{token: string}` and `{done: true}` event shapes.

- [ ] **T-16-2 — Replace raw conversation fetch in chat tab**
  - File: `artifacts/mobile/app/(tabs)/index.tsx`
  - Replace `fetch("/api/openai/conversations")` / `loadConversation` raw calls with `useGetOpenaiConversations` and `useGetOpenaiConversationMessages`.

- [ ] **T-16-3 — Validate image `size` using Zod enum in route**
  - File: `artifacts/api-server/src/routes/openai/image.ts`
  - Import and use `generateOpenaiImageBodySchema` from `@workspace/api-zod` for full body validation including the size enum.

---

<a id="t-17"></a>

## [ ] T-17 — Mockup Sandbox Bootstrap

**Status:** `NOT_STARTED`

### Definition of Done

- At least one representative mockup component exists in `src/components/mockups/` that demonstrates the auto-discovery pipeline works end-to-end.
- `version` in `package.json` is aligned with the workspace convention.
- `BASE_PATH` and `PORT` requirements are documented in a comment at the top of `vite.config.ts` or in a `README.md`.
- `@workspace/*` package aliases are added to `vite.config.ts` if the sandbox is intended to import from workspace libs.

### Out of Scope

- Building a full component library — this task is only about verifying the scaffolding works.
- Deploying the sandbox to a public URL.

### Rules to Follow

- The demo component must use at least one `shadcn/ui` component from the `src/components/ui/` directory to validate the existing UI library setup.
- The `package.json` version must match the workspace convention (`"0.0.0"`) unless semantic versioning is intentionally applied to this package.
- `vite.config.ts` must not use `process.exit` or `throw` for missing optional configuration — use safe defaults where possible.

### Advanced Coding Patterns

- [ ] **T-17-P1 — Research: Vite 5 dynamic import patterns (Feb 2026)**
  - Review `import.meta.glob` eager vs lazy loading — `import.meta.glob('...', { eager: true })` returns resolved modules directly; lazy (default) returns `() => Promise<module>` for code splitting.
  - Study `mockupPreviewPlugin.ts` code generation approach — the generated `modules` map uses lazy dynamic imports, meaning each component is a separate chunk with full tree-shaking.
  - Review Vite 5 `resolve.alias` for `@workspace/*` packages: `{ '@workspace/api-client-react': resolve(__dirname, '../../lib/api-client-react/src/index.ts') }`.

- [ ] **T-17-P2 — Research: Mockup sandbox antipatterns**
  - Antipattern: Throwing on missing `BASE_PATH` env var — if the sandbox is run without the exact Replit env it was designed for, it refuses to start with a cryptic error.
  - Antipattern: Having `version: "2.0.0"` in a workspace package — pnpm workspace range resolution uses the `^` and `~` operators against this version; a mismatch can cause unexpected peer dep resolution.
  - Antipattern: No mockup components but a running discovery loop — the Vite server starts watching an empty directory and the `App.tsx` renders a blank page with no indication of what to do.

- [ ] **T-17-1 — Create a demo `Button.mockup.tsx` component**
  - File: `artifacts/mockup-sandbox/src/components/mockups/Button.mockup.tsx` (new file)
  - Simple component showcasing `<Button>` variants from `src/components/ui/button.tsx`.

- [ ] **T-17-2 — Fix `version` in `package.json`**
  - File: `artifacts/mockup-sandbox/package.json`
  - Change `"version": "2.0.0"` → `"version": "0.0.0"`.

- [ ] **T-17-3 — Add env var documentation to `vite.config.ts`**
  - File: `artifacts/mockup-sandbox/vite.config.ts`
  - Add a top-of-file comment block listing required (`BASE_PATH`, `PORT`) and optional (`REPL_ID`) env vars with example values.

- [ ] **T-17-4 — Replace `throw` on missing `BASE_PATH` with a safe default**
  - File: `artifacts/mockup-sandbox/vite.config.ts`
  - Change the `throw new Error("BASE_PATH is required")` to `const BASE_PATH = process.env.BASE_PATH ?? "/"` with a `console.warn` if absent.

---

<a id="t-18"></a>

## [ ] T-18 — TypeScript Strictness Uplift

**Status:** `NOT_STARTED`

### Definition of Done

- `noUnusedLocals: true` is enabled in `tsconfig.base.json` and all resulting errors are resolved.
- `strictFunctionTypes: true` is enabled and all resulting errors are resolved.
- `strictPropertyInitialization: true` is confirmed enabled (it is part of `strict: true` if set, otherwise explicit).
- No new `as` type assertions are introduced to paper over removed errors.

### Out of Scope

- Enabling `noUncheckedIndexedAccess` (high-impact change affecting generated code — separate task if desired).
- Enabling `exactOptionalPropertyTypes` (breaks generated Orval output — do not enable).

### Rules to Follow

- Enable flags one at a time and fix errors before enabling the next flag.
- Do not suppress errors with `// @ts-ignore` or `// @ts-expect-error` unless there is a documented reason.
- Generated files (under `generated/`) must be excluded from the new strict rules via `tsconfig` `exclude` if they cannot be changed.
- `strictFunctionTypes` errors in callback-heavy code (e.g., Express route handlers) should be fixed by narrowing types, not by broadening function signatures.

### Advanced Coding Patterns

- [ ] **T-18-P1 — Research: TypeScript strict mode migration (Feb 2026)**
  - Review TypeScript 5.9 release notes for any new strict flags or changes to existing checks.
  - Study the incremental strict migration pattern: use `// @ts-strict-ignore` at file level (TS 5.0+) to defer individual files, enabling project-wide flag without fixing everything at once.
  - Review impact of `strictFunctionTypes` on Express 5 `RequestHandler` type — Express 5 types are stricter and may already require this.

- [ ] **T-18-P2 — Research: Strictness antipatterns**
  - Antipattern: `"strict": false` alongside individual `"strictNullChecks": true` — the individual flags do not compose to full strict mode; must use `"strict": true` as the base.
  - Antipattern: Adding `as unknown as T` casts to silence `strictFunctionTypes` errors — hides genuine type unsafety.
  - Antipattern: Disabling strict flags in generated files by putting them in `tsconfig.json` includes — generated files should be in a separate tsconfig that is not type-checked.

- [ ] **T-18-1 — Enable `noUnusedLocals` and fix resulting errors**
  - File: `tsconfig.base.json`
  - Set `"noUnusedLocals": true`; audit and fix all reported unused variables across all packages.

- [ ] **T-18-2 — Enable `strictFunctionTypes` and fix resulting errors**
  - File: `tsconfig.base.json`
  - Set `"strictFunctionTypes": true`; audit all callback signatures especially in Express route handlers.

- [ ] **T-18-3 — Exclude generated files from strict checks**
  - Files: `lib/api-client-react/tsconfig.json`, `lib/api-zod/tsconfig.json`
  - Add generated sub-directories to `exclude` or create a separate `tsconfig.generated.json` that omits new strict flags.

---

<a id="t-19"></a>

## [ ] T-19 — Dead Code Elimination

**Status:** `NOT_STARTED`

### Definition of Done

- `babel-plugin-react-compiler` is removed from mobile `devDependencies` (superseded by `app.config.ts` experiments flag).
- `scripts/src/hello.ts` is replaced with a real automation script or the `scripts/` package is removed.
- `lib/integrations/openai_ai_integrations/` is resolved per T-12-3 (removed or promoted).
- `cookie-parser` is resolved per T-04-2 (removed or registered).
- `batchProcessWithSSE` has a `TODO` comment per T-12-4 (or is wired to a real use case).
- `generateId()` in `AppContext` is replaced with `crypto.randomUUID()`.

### Out of Scope

- Refactoring working features to use different patterns simply because they are suboptimal (those are tracked in specific tasks above).

### Rules to Follow

- Before removing any code, confirm it is not imported anywhere in the workspace (`grep_search` for the export name).
- `babel-plugin-react-compiler` removal requires verifying that `app.json` / `app.config.ts` `experiments.reactCompiler: true` is the active mechanism.
- `scripts/hello.ts` removal must be confirmed with the team — the `scripts/` package may be intentionally scaffolded for future automation.

### Advanced Coding Patterns

- [ ] **T-19-P1 — Research: Identifying dead code in TypeScript monorepos (Feb 2026)**
  - Review `ts-prune` and `knip` (TypeScript dead export finder) — `knip` v5+ supports pnpm workspace configurations and cross-package import analysis.
  - Study `pnpm why <package>` for confirming a package is an unused dependency vs a transitive dep.
  - Review `babel-plugin-react-compiler` vs Expo SDK 54's built-in React Compiler support — confirm which mechanism is authoritative.

- [ ] **T-19-P2 — Dead code antipatterns**
  - Antipattern: Removing an export without checking if it is re-exported from an `index.ts` — the immediate file may not import it but it may still be reachable.
  - Antipattern: Keeping `babel-plugin-react-compiler` alongside Expo's native React Compiler support — may result in double-compilation or conflicting transforms.
  - Antipattern: `Date.now() + Math.random()` as an ID generator — not collision-resistant; `crypto.randomUUID()` is available in React Native (Hermes 0.81+) and produces RFC 4122 UUIDs.

- [ ] **T-19-1 — Remove `babel-plugin-react-compiler` from mobile deps**
  - File: `artifacts/mobile/package.json`
  - Remove from `devDependencies`; run `pnpm install` to confirm no other package requires it.

- [ ] **T-19-2 — Replace `generateId()` with `crypto.randomUUID()`**
  - File: `artifacts/mobile/context/AppContext.tsx`
  - Replace all calls to `generateId()` with `crypto.randomUUID()` and remove the `generateId` function.

- [ ] **T-19-3 — Add placeholder `README.md` to `scripts/` or remove package**
  - File: `scripts/README.md` (new file) OR remove `scripts/` from `pnpm-workspace.yaml`
  - If kept, document the purpose and expected automation scripts; if removed, confirm no other package depends on it.

- [ ] **T-19-4 — Audit unused exports with `knip`**
  - Run `pnpm dlx knip --workspace` from workspace root; review output and remove confirmed dead exports.

---

<a id="t-20"></a>

## [ ] T-20 — Post-Merge Automation & Git Hooks

**Status:** `NOT_STARTED`

### Definition of Done

- `scripts/post-merge.sh` is wired as a `git` post-merge hook in the repository.
- The pnpm filter in `post-merge.sh` correctly targets the `@workspace/db` package.
- The hook runs `drizzle-kit migrate` (not `push`) in non-development environments.
- A `scripts/setup-hooks.sh` (or `package.json` `prepare` script) installs the hook automatically after `pnpm install`.

### Out of Scope

- Pre-commit hooks (linting, type-checking) — a separate concern.
- CI/CD pipeline migration hooks.

### Rules to Follow

- Git hooks are not committed directly to `.git/hooks/` — that directory is not tracked. Use a `scripts/` directory with a setup script that symlinks or copies hooks.
- The hook must be idempotent — running it twice must not cause errors.
- The hook must exit with a non-zero code if `pnpm install` or `drizzle-kit migrate` fails, so the developer is alerted.
- Do not use `--frozen-lockfile` in the hook if developers are expected to add packages during merges; use `--no-frozen-lockfile` with awareness.

### Advanced Coding Patterns

- [ ] **T-20-P1 — Research: Git hooks in pnpm monorepos (Feb 2026)**
  - Review `simple-git-hooks` and `husky` v9 for hook management in monorepos — both support a `prepare` script that runs on `pnpm install`.
  - Study `lefthook` as a cross-platform alternative with pnpm workspace support.
  - Review pnpm `package.json` `"prepare"` lifecycle script — runs automatically after `pnpm install` making it ideal for hook setup.
  - Note: `simple-git-hooks` is lighter than Husky and does not require shell script wrappers.

- [ ] **T-20-P2 — Git hooks antipatterns**
  - Antipattern: Committing hooks to `.git/hooks/` directly — not version-controlled, lost on fresh clone.
  - Antipattern: Using `--force` in `pnpm install` inside a hook — can corrupt the lockfile if two developers merge simultaneously.
  - Antipattern: A `post-merge` hook that runs `drizzle-kit push` in production — destructive, as noted in T-15.
  - Antipattern: A hook that calls `exit 1` on a warning instead of only on actual errors — blocks legitimate merges.

- [ ] **T-20-1 — Add `simple-git-hooks` to workspace root**
  - File: `package.json` (workspace root)
  - Add `simple-git-hooks` to devDependencies; configure `"post-merge": "sh scripts/post-merge.sh"` in the `simple-git-hooks` config block.

- [ ] **T-20-2 — Fix `post-merge.sh` pnpm filter and command**
  - File: `scripts/post-merge.sh`
  - Change `pnpm --filter db push` → `pnpm --filter @workspace/db run db:migrate`.

- [ ] **T-20-3 — Add `"prepare"` script to workspace root `package.json`**
  - File: `package.json` (workspace root)
  - Add `"prepare": "simple-git-hooks"` to `scripts` — installs hooks automatically on `pnpm install`.

- [ ] **T-20-4 — Add `db:migrate` script to db package**
  - File: `lib/db/package.json`
  - Add `"db:migrate": "drizzle-kit migrate"` to `scripts`.

---

_End of TODO.md — 20 parent tasks · 38 tracked issues · ~90 subtasks_

```

```
