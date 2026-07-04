# Knowledge Assistant

A mini "chat with your documents" web app — login, upload a PDF/TXT, and ask an AI
questions about it, with ChatGPT-style multi-conversation history and a live token
usage counter.

Built for the Junior Dev Assessment (Part 1 — Coding Task). See the repo root for
`AI_JOURNAL.md`, `DECISIONS.md`, and `TASK.md`.

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router) + TypeScript |
| Database | SQLite (file-based) via Drizzle ORM |
| Vector DB | None — simple keyword-scored chunking instead (see Known Issues) |
| Auth | iron-session (httpOnly cookie) + bcrypt password hashing |
| AI provider | OpenAI-compatible chat completions — Groq, Gemini, OpenAI, or Anthropic, switchable via env |
| PDF parsing | `pdf-parse` |
| Styling | Tailwind CSS v4 |
| Markdown rendering | `react-markdown` + `remark-gfm` |

## Setup & Run

### Option A — Docker (one command)

```bash
cp .env.example .env
# edit .env: set AI_PROVIDER, AI_API_KEY, AI_MODEL (see comments in .env.example)
docker compose up
```

App runs at http://localhost:3000. Data (SQLite + uploaded files) persists in a
named Docker volume across restarts.

### Option B — Local dev

```bash
cd webapp
npm install
cp ../.env.example ../.env   # then edit ../.env with your AI key
npm run dev
```

App runs at http://localhost:3000 (reads `.env` from the repo root).

### Demo accounts

| Username | Password |
|---|---|
| `admin1` … `admin4` | `admin123` |

Four mock accounts are seeded automatically on first run so you can demo
per-user isolation (each user only sees their own conversations and documents).

## Features Done

- [x] Login + Protected Routes (bcrypt + iron-session, middleware-guarded)
- [x] Upload PDF/TXT (type/size validation, sanitized filenames, path-traversal guard)
- [x] Chat with AI (streaming, timeout, error handling with actionable hints)
- [x] Chat with Uploaded File Context (chunked retrieval, per-document Q&A)
- [x] Token Usage Counter (per message, per conversation, and per-user total)
- [x] Docker Compose + healthcheck (`GET /api/health`)
- [x] Streaming responses (Server-Sent Events, token-by-token)
- [x] Markdown rendering in AI replies
- [x] Multi-conversation history (ChatGPT-style sidebar — create/switch/delete chats)
- [x] Citation (assistant replies show which document chunk the answer came from)
- [x] Rate limiting (per-user, in-memory, 20 requests/min on `/api/chat`)
- [ ] RAG with a real vector DB (not done — see Known Issues)
- [ ] Unit tests (not done — no test runner configured yet)

## Architecture

```
[Login] → iron-session cookie → middleware protects /chat, /upload, /api/*

[Upload PDF/TXT]
  → validate (type/size/non-empty) → sanitize filename → save to disk
  → extract text (pdf-parse or raw utf-8) → chunk (~800 chars, 100 overlap)
  → store chunks in SQLite

[Chat]
  → pick/create a conversation (sidebar) → optionally pick a document
  → retrieve top-3 chunks scored by keyword overlap with the question
  → build system prompt with those chunks → send conversation history + question
  → stream the AI response back over SSE, token-by-token
  → persist user + assistant messages (with token usage + citation) to SQLite
  → auto-title the conversation from its first message
```

**Layering** (`.cursor/rules/01-part1-security.mdc`):
`app/api/**/route.ts` (HTTP only) → `lib/services/**` (business logic) →
`lib/repositories/**` (DB access) → `lib/**` (shared utils: chunking, AI client,
rate limiting, session).

**Data model**: `users` → `conversations` → `messages` (each message optionally
tied to a `documents` row for citation); `documents` → `document_chunks`.
Documents are scoped to a user, not a single conversation, so any conversation
can reference any of that user's uploaded files.

## Known Issues

- **Chunking is keyword-based, not semantic.** Retrieval scores chunks by literal
  term overlap with the question — no embeddings, no vector DB. Works for direct
  factual questions on small-to-medium documents; struggles with paraphrased
  questions or documents where the answer requires connecting distant chunks.
  See `DECISIONS.md` (Decision 2) for the reasoning and how to upgrade to real RAG.
- **Rate limiting is in-memory, single-instance.** Fine for this assessment
  (one container), but resets on restart and doesn't share state across multiple
  app instances — would need Redis for a real multi-instance deployment.
- **No automated tests yet.** Validation was done manually + via `curl` smoke
  tests against every API route; there's no test runner configured.
- **Citation is chunk-index based, not exact-quote based.** It tells you which
  chunk(s) of which document were used, not the precise sentence — good enough
  to verify an answer, not a full inline-quote citation system.
- **Mock accounts share one password.** `admin1`–`admin4` all use `admin123` —
  fine for a local demo, not how you'd provision real multi-user accounts.
