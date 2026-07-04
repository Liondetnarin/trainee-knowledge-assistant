# Knowledge Assistant

Mini Knowledge Assistant — Junior Dev Assessment Part 1

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 14 (App Router) + TypeScript |
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

**Mock user:** `admin` / `admin123`

## Features Done

- [ ] Login + Protected Routes
- [ ] File Upload (PDF/TXT)
- [ ] Chat with AI
- [ ] Chat with Uploaded File Context
- [ ] Token Usage Counter
- [ ] Docker Compose + Healthcheck

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

- [docs/assignment-spec.md](./docs/assignment-spec.md) — เอกสารต้นฉบับโจทย์
- [AI_JOURNAL.md](./AI_JOURNAL.md)
- [DECISIONS.md](./DECISIONS.md)
- [TASK.md](./TASK.md)
- Part 2–4: [docs/](./docs/)

## Known Issues

- File context ใช้ simple chunking ไม่ใช่ Vector DB — ความแม่นยำจำกัด
- _(เพิ่มเมื่อพบ issue อื่น)_

## Template / Boilerplate

- Next.js: `create-next-app`
- _(ระบุ template อื่นถ้าใช้)_
