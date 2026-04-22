# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

UIGen is an AI-powered React component generator. Users describe components in a chat interface, Claude generates/edits files via tool calls, and a sandboxed iframe renders the result live using Babel + esm.sh — no build step needed for preview.

## Commands

```bash
# Initial setup (install deps, generate Prisma client, run migrations)
npm run setup

# Development (Turbopack)
npm run dev

# Build
npm run build

# Run all tests
npm test

# Run a single test file
npx vitest run src/lib/__tests__/file-system.test.ts

# Lint
npm run lint

# Reset database
npm run db:reset
```

Requires `ANTHROPIC_API_KEY` in `.env` for real AI responses; omitting it falls back to a mock provider.

## Architecture

### Request Flow

```
User message → POST /api/chat (streaming)
                    ↓
         Claude (claude-haiku-4-5) streams text + tool calls
                    ↓
         Tools: str_replace_editor / file_manager
                    ↓
         FileSystemContext updates virtual FS state
                    ↓
         jsx-transformer.ts: Babel transform + import map
                    ↓
         PreviewFrame iframe re-renders component
```

### Key Architectural Decisions

**Virtual File System** — All files live in React state (`FileSystemContext`). No disk writes. The filesystem serializes to a node tree for the DB (`Project.fileData`) and is also sent in each `/api/chat` request body so the server can apply tool calls and return the updated state.

**AI Tool Calling** — Claude edits code via two tools defined in `src/lib/tools/`:
- `str_replace_editor`: operations `view`, `create`, `str_replace`, `insert` (and a no-op `undo_edit`)
- `file_manager`: operations `rename`, `delete`

Tool handlers that apply these operations to the virtual FS live in `FileSystemContext.handleToolCall()`.

**Preview Sandbox** — `PreviewFrame.tsx` transpiles each virtual file via Babel (stripping CSS imports), creates blob URLs, and injects them into an iframe using an import map. External deps resolve to esm.sh. Entry point discovery order: `/App.jsx` → `/App.tsx` → `/index.jsx` → first JSX file found.

**State Management** — Two contexts cover the entire app:

- `ChatContext` (`src/lib/contexts/chat-context.tsx`): messages, input, submit handler
- `FileSystemContext` (`src/lib/contexts/file-system-context.tsx`): virtual FS, active file, tool call handling

**Auth** — JWT sessions via `jose` stored in cookies. Server actions in `src/actions/index.ts` handle sign up/in/out. `src/middleware.ts` protects routes.

### Layout

Three-panel resizable layout in `src/app/main-content.tsx`:

- Left (35%): Chat interface
- Right (65%): Tabs for Preview (iframe) and Code (file tree + Monaco editor)

### Database

SQLite via Prisma. Schema: `User` (email, bcrypt password) → `Project` (name, messages JSON, fileData JSON).

The database schema is defined in `prisma/schema.prisma`. Reference it anytime you need to understand the structure of data stored in the database.

### System Prompt Constraints

The generation prompt (`src/lib/prompts/generation.tsx`) enforces rules that the AI must follow:
- Root entry point must be `/App.jsx`
- Use Tailwind for all styling (no hardcoded CSS)
- Use `@/` import alias for local file imports

### Path Alias

`@/*` maps to `./src/*` (configured in `tsconfig.json`).

## Testing

Tests use Vitest + jsdom. Test files sit in `__tests__` directories alongside source. Component tests use `@testing-library/react`.

## Tech Stack

Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS v4, Radix UI, Monaco Editor, Vercel AI SDK 4.x, `@ai-sdk/anthropic`, Prisma 6 + SQLite, `jose` + `bcrypt` for auth, `@babel/standalone` for in-browser JSX transform.
