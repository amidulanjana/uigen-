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

**Virtual File System** — All files live in React state (`FileSystemContext`). No disk writes. Files are serialized to JSON and stored in the `Project.fileData` DB column.

**AI Tool Calling** — Claude edits code by calling `str_replace_editor` (for targeted edits) and `file_manager` (for create/delete/rename). Tool handlers live in `src/lib/file-system-context.tsx` and the tool definitions in `src/lib/tools/`.

**Preview Sandbox** — `PreviewFrame.tsx` injects transformed code into an iframe with an import map pointing to esm.sh for npm packages. Babel standalone runs in the browser to handle JSX/TSX.

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

### Path Alias

`@/*` maps to `./src/*` (configured in `tsconfig.json`).

## Testing

Tests use Vitest + jsdom. Test files sit in `__tests__` directories alongside source. Component tests use `@testing-library/react`.

## Tech Stack

Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS v4, Radix UI, Monaco Editor, Vercel AI SDK 4.x, `@ai-sdk/anthropic`, Prisma 6 + SQLite, `jose` + `bcrypt` for auth, `@babel/standalone` for in-browser JSX transform.
