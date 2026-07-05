# Knowledge Assistant

เว็บแอป "คุยกับเอกสารของคุณ" ขนาดเล็ก - login, อัปโหลด PDF/TXT แล้วถาม AI
เกี่ยวกับเนื้อหาในเอกสารได้ พร้อมประวัติแชทหลายห้องแบบ ChatGPT และตัวนับ
token usage แบบ real-time

ทำขึ้นสำหรับ Junior Dev Assessment (Part 1 - Coding Task) - ดู
`AI_JOURNAL.md`, `DECISIONS.md` และ `TASK.md` ที่ root ของ repo

## Tech Stack

| Layer | ตัวเลือกที่ใช้ |
|---|---|
| Framework | Next.js 16 (App Router) + TypeScript |
| Database | SQLite (file-based) ผ่าน Drizzle ORM |
| Vector DB | ไม่ใช้ - ใช้ keyword-scored chunking แทน (ดู Known Issues) |
| Auth | iron-session (httpOnly cookie) + bcrypt hash รหัสผ่าน |
| AI provider | OpenAI-compatible chat completions - สลับได้ระหว่าง Groq, Gemini, OpenAI, Anthropic ผ่าน env |
| PDF parsing | `pdf-parse` |
| Styling | Tailwind CSS v4 |
| Markdown rendering | `react-markdown` + `remark-gfm` |

## Setup & Run

### วิธี A - Docker (คำสั่งเดียว)

```bash
cp .env.example .env
# แก้ .env: ตั้งค่า AI_PROVIDER, AI_API_KEY, AI_MODEL (ดู comment ใน .env.example)
docker compose up
```

แอปรันที่ http://localhost:3000 - ข้อมูล (SQLite + ไฟล์ที่อัปโหลด) เก็บใน
Docker named volume ไม่หายเมื่อ restart

### บัญชีสำหรับ demo

| Username | Password |
|---|---|
| `admin1` … `admin4` | `admin123` |

ระบบ seed บัญชี mock 4 บัญชีให้อัตโนมัติตอนรันครั้งแรก เพื่อ demo
การแยกข้อมูลรายผู้ใช้ (แต่ละคนเห็นเฉพาะบทสนทนาและเอกสารของตัวเอง)

## Features Done

- [x] Login + Protected Routes (bcrypt + iron-session, กันด้วย middleware)
- [x] Upload PDF/TXT (validate type/size, sanitize ชื่อไฟล์, กัน path traversal)
- [x] Chat with AI (streaming, timeout, error handling พร้อม hint บอกวิธีแก้)
- [x] Chat with Uploaded File Context (chunked retrieval, ถาม-ตอบรายเอกสาร)
- [x] Token Usage Counter (ต่อข้อความ, ต่อบทสนทนา, และรวมต่อผู้ใช้)
- [x] Docker Compose + healthcheck (`GET /api/health`)
- [x] Streaming responses (Server-Sent Events แบบ token-by-token)
- [x] Markdown rendering ในคำตอบ AI
- [x] ประวัติแชทหลายห้อง (sidebar แบบ ChatGPT - สร้าง/สลับ/ลบแชทได้)
- [x] Citation (คำตอบแสดงว่าใช้ chunk ไหนของเอกสารไหนตอบ)
- [x] Rate limiting (ต่อผู้ใช้, in-memory, 20 requests/นาที ที่ `/api/chat`)
- [ ] RAG ด้วย vector DB จริง (ยังไม่ทำ - ดู Known Issues)
- [ ] Unit tests (ยังไม่ทำ - ยังไม่ได้ตั้ง test runner)

## Architecture

```
[Login] → iron-session cookie → middleware คุ้มครอง /chat, /upload, /api/*

[Upload PDF/TXT]
  → validate (type/size/ไม่ว่าง) → sanitize ชื่อไฟล์ → บันทึกลง disk
  → ดึงข้อความ (pdf-parse หรือ raw utf-8) → chunk (~800 ตัวอักษร, overlap 100)
  → เก็บ chunks ลง SQLite

[Chat]
  → เลือก/สร้างบทสนทนา (sidebar) → เลือกเอกสารได้ (ไม่บังคับ)
  → ดึง chunks 3 อันดับแรกที่ keyword ตรงกับคำถามมากที่สุด
  → ประกอบ system prompt จาก chunks เหล่านั้น → ส่งประวัติแชท + คำถาม
  → stream คำตอบ AI กลับผ่าน SSE แบบ token-by-token
  → บันทึกข้อความ user + assistant (พร้อม token usage + citation) ลง SQLite
  → ตั้งชื่อบทสนทนาอัตโนมัติจากข้อความแรก
```

**Layering** (ตาม `.cursor/rules/01-part1-security.mdc`):
`app/api/**/route.ts` (HTTP เท่านั้น) → `lib/services/**` (business logic) →
`lib/repositories/**` (เข้าถึง DB) → `lib/**` (utils กลาง: chunking, AI client,
rate limiting, session)

**Data model**: `users` → `conversations` → `messages` (แต่ละ message
ผูกกับ `documents` ได้เพื่อทำ citation); `documents` → `document_chunks`
เอกสาร scope ที่ระดับ user ไม่ใช่ต่อบทสนทนา - ทุกแชทของ user เดียวกัน
เลือกใช้เอกสารที่เคยอัปโหลดไว้ได้เลยโดยไม่ต้องอัปโหลดซ้ำ

## Known Issues

- **Chunking เป็น keyword-based ไม่ใช่ semantic** - retrieval ให้คะแนน chunk
  จากจำนวนคำที่ตรงกับคำถามตรง ๆ ไม่มี embeddings/vector DB ใช้ได้ดีกับคำถาม
  เชิงข้อเท็จจริงบนเอกสารขนาดเล็ก-กลาง แต่จะอ่อนกับคำถามที่ paraphrase
  หรือคำตอบที่ต้องเชื่อมหลาย chunk ที่อยู่ห่างกัน - ดูเหตุผลและแนวทาง upgrade
  เป็น RAG จริงใน `DECISIONS.md` (Decision 2)
- **Rate limiting เป็น in-memory instance เดียว** - พอสำหรับงานนี้
  (container เดียว) แต่ reset เมื่อ restart และไม่แชร์ state ข้ามหลาย instance -
  ถ้า deploy จริงหลายเครื่องต้องใช้ Redis
- **ยังไม่มี automated tests** - ตรวจด้วยมือ + `curl` smoke test ครบทุก
  API route แต่ยังไม่ได้ตั้ง test runner
- **Citation บอกระดับ chunk ไม่ใช่ประโยคเป๊ะ ๆ** - บอกว่าใช้ chunk ไหนของ
  เอกสารไหน ไม่ได้ชี้ประโยคที่ยกมา - พอสำหรับ verify คำตอบ แต่ยังไม่ใช่ระบบ
  inline-quote citation เต็มรูปแบบ
- **บัญชี mock ใช้รหัสผ่านเดียวกัน** - `admin1`–`admin4` ใช้ `admin123`
  เหมือนกันหมด - เหมาะกับ demo ในเครื่อง ไม่ใช่วิธี provision บัญชีจริง
