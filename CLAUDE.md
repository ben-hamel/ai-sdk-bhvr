# CLAUDE.md

## Project Overview

Monorepo exploring Cloudflare's compute offerings, auth patterns, and AI frameworks (Vercel AI SDK, Mastra). Stack: Bun, Hono, Vite, React, Cloudflare Workers, PostgreSQL (Neon + Hyperdrive), Better Auth, Drizzle ORM.

## Monorepo Structure

```
/
├── client/      # Vite + React 19 SPA
├── server/      # Hono API on Cloudflare Workers
├── shared/      # Shared types/utilities
├── turbo.json   # Turbo pipeline config
└── biome.json   # Lint/format config (root)
```

### Server (`/server`)
- **Runtime**: Cloudflare Workers via Wrangler
- **Framework**: Hono
- **DB**: Drizzle ORM + Neon (serverless PostgreSQL via Hyperdrive)
- **Auth**: Better Auth
- **AI**: Vercel AI SDK (`ai`) + `@ai-sdk/google`
- **Routes**: `src/index.ts` → `src/routes.ts` → `src/modules/<module>/<module>.routes.ts`
- **Modules**: `admin`, `chats`, `health`, `onboarding`, `org-onboarding`

### Client (`/client`)
- **Framework**: Vite + React 19
- **Routing**: React Router v7
- **State/Data**: TanStack Query
- **Forms**: TanStack Form
- **UI**: Radix UI + Tailwind CSS v4 + shadcn components
- **AI**: `@ai-sdk/react`, `ai-elements`, `streamdown`

### Shared (`/shared`)
- Shared types and utilities used by both client and server

## Commands

```bash
# Install dependencies
bun install

# Dev (all workspaces)
bun dev

# Dev individual workspaces
bun dev:client
bun dev:server

# Build
bun build

# Lint
bun lint

# Format
bun format

# Type check
bun type-check

# Database (Docker)
bun db:start    # Start PostgreSQL container
bun db:stop     # Stop container
bun db:down     # Tear down container

# Add package to specific workspace
bun add <pkg> --cwd server
bun add <pkg> --cwd client

# Update packages interactively
bun update -i -r

# Deploy server to Cloudflare
bun deploy:server
```

## Code Style

- **Formatter/Linter**: Biome (not ESLint/Prettier)
- **Indent**: 2 spaces, LF line endings, 80 char line width
- **TypeScript**: strict mode, no `any`
- Excluded from Biome: `server/worker-configuration.d.ts`, `server/drizzle/meta`, `client/src/components/ai-elements`, `client/src/components/ui`

## Environment Setup

Copy `.env.example` to `.env` in both `client/` and `server/` directories.

Server env vars (set in `wrangler.jsonc` for prod, `.env` for local):
- `CORS_ORIGIN`
- `BETTER_AUTH_URL`
- Secrets: `BETTER_AUTH_SECRET`, `DATABASE_URL` (via Hyperdrive binding)

## Key Architecture Notes

- Server runs on Cloudflare Workers (edge runtime) — no Node.js APIs without `nodejs_compat` flag
- DB access uses `@neondatabase/serverless` + Cloudflare Hyperdrive for connection pooling
- Auth is handled by Better Auth at `/api/auth/*` before hitting v1 routes
- API routes are versioned under `/api/v1/`
- Shared package is a workspace dep used by both client and server
- Client imports server types directly via `"server": "workspace:*"`
