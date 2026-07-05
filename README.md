# Knowledge Assistant

Mini Knowledge Assistant — Junior Dev Assessment Part 1

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16 (App Router) + TypeScript |
| Styling | Tailwind CSS |
| Database | SQLite + Drizzle ORM |
| Auth | iron-session + bcrypt |
| File Context | Simple text chunking (Phase 1) |
| AI | OpenAI / Anthropic (via env) |
| Deploy | Docker Compose |

## Setup & Run

```bash
# 1. Copy env
cp .env.example .env
# แก้ AI_API_KEY และ SESSION_SECRET

# 2. Run
docker compose up --build
```

เปิด http://localhost:3000

**Mock users:** `admin1` … `admin4` / `admin123` (seed อัตโนมัติตอนรันครั้งแรก — แยกข้อมูลรายผู้ใช้)

## Features Done

- [x] Login + Protected Routes
- [x] File Upload (PDF/TXT)
- [x] Chat with AI
- [x] Chat with Uploaded File Context
- [x] Token Usage Counter
- [x] Docker Compose + Healthcheck

**Bonus:**

- [x] Streaming response
- [x] Markdown rendering
- [x] Citation (แสดง source chunk ที่ใช้ตอบ)
- [x] Conversation history (multi-conversation sidebar)
- [x] Rate limiting (per-user, 20 req/min)
- [ ] RAG with Vector DB (ใช้ simple chunking แทน — ดู Known Issues)

## Architecture

```
Browser → Next.js App Router
              ├── middleware (auth)
              ├── API routes (thin)
              ├── services (business logic)
              └── repositories (SQLite + files)
```

ดูรายละเอียด: `.cursor/skills/part-1-webapp/architecture.md`

## Related Documents

- **[site/index.html](./site/index.html) — หน้ารวมงานทั้ง 4 Parts อ่านง่าย (เปิดในเบราว์เซอร์หลัง clone หรือดูออนไลน์ผ่าน GitHub Pages)**
- [docs/assignment-spec.md](./docs/assignment-spec.md) — เอกสารต้นฉบับโจทย์
- [AI_JOURNAL.md](./AI_JOURNAL.md)
- [DECISIONS.md](./DECISIONS.md)
- [TASK.md](./TASK.md)
- **Part 2 — Video:** _https://youtu.be/5LivhZ2IVhI?si=hDSD-iXKKdGo6E2U_ ([bullet notes](./docs/part-2-video-notes.md))
- **Part 3 — Leadership:** [docs/part-3-leadership.md](./docs/part-3-leadership.md)
- **Part 4 — Legacy Thinking:** [docs/part-4-legacy.md](./docs/part-4-legacy.md)

## Known Issues

- File context ใช้ simple chunking ไม่ใช่ Vector DB — ความแม่นยำจำกัด
- _(เพิ่มเมื่อพบ issue อื่น)_

## Template / Boilerplate

- Next.js: `create-next-app`
- _(ระบุ template อื่นถ้าใช้)_
