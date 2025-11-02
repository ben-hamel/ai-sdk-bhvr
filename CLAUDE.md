# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a monorepo template for building AI chat applications, combining:
- **Client**: Vite + React 19 + TypeScript frontend with AI SDK React hooks
- **Server**: Hono API running on Cloudflare Workers with PostgreSQL persistence
- **Shared**: Common TypeScript types and schemas

The stack uses Bun as the package manager and runtime, with Turbo for monorepo orchestration.

## Development Commands

**Start development servers (client + server):**
```bash
bun dev
```

**Start individual workspaces:**
```bash
bun dev:client  # Start only the client (Vite dev server)
bun dev:server  # Start only the server (Wrangler dev)
```

**Build:**
```bash
bun build              # Build all workspaces
bun build:client       # Build only client
bun build:server       # Build only server
```

**Code quality:**
```bash
bun lint               # Lint with Biome
bun format             # Format code with Biome
bun type-check         # Type-check all workspaces
```

**Testing:**
```bash
bun test
```

**Deploy server:**
```bash
bun deploy:server      # Deploy to Cloudflare Workers
```

**Install workspace-specific packages:**
```bash
bun add <package> --cwd <workspace>
# Example: bun add -D @types/pg --cwd server
```

## Architecture

### Server (Hono + Cloudflare Workers)

**Entry point:** `server/src/index.ts`

The server is a Hono application designed to run on Cloudflare Workers with Node.js compatibility enabled. Key features:

- **Environment bindings** (`Bindings` type): Cloudflare Workers environment variables including:
  - `GOOGLE_GENERATIVE_AI_API_KEY`: Google AI API key
  - `DATABASE_URL`: PostgreSQL connection string

- **Chat endpoint** (`POST /chat`): Handles streaming chat completions with persistent storage
  - Creates new chat sessions or loads existing ones from PostgreSQL
  - Uses AI SDK's `streamText()` with Google Gemini 2.5 Flash
  - Returns UI message stream via `toUIMessageStreamResponse()`
  - Message metadata includes token usage (input/output/total/reasoning/cached)
  - On stream completion, persists all messages to PostgreSQL in a transaction
  - Messages are stored with: `id`, `chat_id`, `role`, `content`, `created_at`

- **Database connection pattern**: Creates new `Pool` instances per request, closes in `finally` block
  - Uses PostgreSQL with `pg` library
  - Chat messages stored in `messages` table with foreign key to `chats` table
  - Transaction handling ensures atomicity when saving message history

- **Wrangler configuration**: `server/wrangler.jsonc`
  - Node.js compatibility enabled via `compatibility_flags: ["nodejs_compat"]`
  - Main entry: `src/index.ts` (TypeScript, transpiled by Wrangler)

**Parts-based chat storage** (`server/src/chat-store.ts`): PostgreSQL persistence using parts-based storage pattern
  - `saveChat()`: Saves messages as individual parts with type preservation
  - `loadChat()`: Reconstructs messages from parts
  - Supports text parts (extensible to tool calls, files, reasoning)

### Client (React + Vite + AI SDK)

**Entry point:** `client/src/main.tsx` → `client/src/app/index.tsx`

The client is a React 19 application using:

- **AI SDK React hooks**: `useChat` from `@ai-sdk/react` for streaming chat interactions
- **AI Elements**: Pre-built UI components from `ai-elements` package
  - `Conversation`, `ConversationContent`: Chat message list container
  - `Message`, `MessageContent`: Individual message rendering
  - `PromptInput`: Multi-part input with attachments, textarea, toolbar
  - `Context`: Token usage indicator with context limit visualization
  - `Response`: Markdown-rendered AI responses

- **Main chat interface** (`client/src/app/routes/chat-page.tsx`):
  - Uses `useChat` with `DefaultChatTransport` pointing to `${SERVER_URL}/chat`
  - Tracks cumulative token usage across all messages via `useMemo`
  - Displays context limit indicator (max 1,114,112 tokens for Gemini 2.5 Flash)
  - Supports text input and file attachments

- **Component structure**:
  - `client/src/components/ai-elements/`: Custom AI-specific components (conversation, message, prompt-input, response, context)
  - `client/src/components/ui/`: Radix UI-based components (button, card, input, etc.)
  - Uses Tailwind CSS 4 with `@tailwindcss/vite` plugin

- **Theme support**: Dark mode via `providers/theme-provider.tsx`

### Shared

**Location:** `shared/src/`

Contains TypeScript types shared between client and server:

- `ApiResponse`: Generic API response shape
- `CustomMessage`: Extended `UIMessage<MessageMetadata>` type
- `MessageMetadata`: Token usage metadata (inputTokens, outputTokens, totalTokens)
- `messageMetadataSchema`: Zod schema for runtime validation

The shared package is built as a workspace dependency and referenced by both client and server.

## Database Schema

PostgreSQL tables (parts-based storage pattern):

- `chats`: Stores chat sessions
  - `id`: UUID (primary key, auto-generated)
  - `created_at`, `updated_at`: Timestamps

- `messages`: Stores message metadata
  - `id`: TEXT (matches AI SDK message ID)
  - `chat_id`: UUID (foreign key to `chats.id`)
  - `role`: TEXT ('user' | 'assistant' | 'system' | 'tool')
  - `created_at`: Timestamp

- `parts`: Stores individual message parts with type preservation
  - `id`: UUID (primary key, auto-generated)
  - `message_id`: TEXT (foreign key to `messages.id`)
  - `type`: TEXT (part type: 'text', 'file', 'tool-call', etc.)
  - `order`: INTEGER (preserves part sequence)
  - Type-specific columns (prefix-based):
    - `text_content`: TEXT (for text parts)
    - `reasoning_content`: TEXT (for reasoning parts)
    - `file_url`, `file_name`, `file_mime_type`: File metadata
    - `tool_call_id`, `tool_call_name`, `tool_call_args`: Tool call data
    - `tool_result_*`: Tool result data
  - `provider_metadata`: JSONB (usage, finish reason, etc.)
  - Constraints ensure complete part definitions

**Migration**: See `server/MIGRATION.md` for upgrading from simple message storage to parts-based storage.

**Schema files**:
- `server/schema-parts.sql`: Recommended parts-based schema (current)


## Key Dependencies

- **AI SDK**: `ai` package with `@ai-sdk/react` and `@ai-sdk/google` for streaming chat
- **Hono**: Lightweight web framework for Cloudflare Workers
- **PostgreSQL**: `pg` client for database persistence
- **Radix UI**: Headless UI primitives for accessible components
- **Tailwind CSS 4**: Utility-first CSS with Vite plugin
- **Zod**: Schema validation (used in shared types)
- **Turbo**: Monorepo build orchestration
- **Biome**: Fast linter and formatter (replaces ESLint + Prettier)

## Environment Variables

**Server** (`.dev.vars` for local development, Workers secrets for production):
- `GOOGLE_GENERATIVE_AI_API_KEY`: Google AI Studio API key
- `DATABASE_URL`: PostgreSQL connection string

**Client** (`client/.env`):
- Server URL configured via `client/src/constants/index.ts` (`SERVER_URL`)

## Important Patterns

1. **Message streaming**: Server uses AI SDK's `streamText()` and `toUIMessageStreamResponse()` for efficient token-by-token streaming
2. **Message metadata**: Token usage attached to messages via `messageMetadata` callback
3. **Database transactions**: Chat history saved atomically using PostgreSQL transactions in stream `onFinish` callback
4. **Workspace dependencies**: Shared types imported via `workspace:*` protocol in package.json
5. **TypeScript strict mode**: All workspaces use strict TypeScript configuration
6. **Cloudflare Workers compatibility**: Server requires `nodejs_compat` flag for Node.js APIs (crypto, process, etc.)

## Postinstall Hook

The monorepo runs `turbo build --filter=shared --filter=server` after `bun install` to ensure workspace dependencies are built before development.
