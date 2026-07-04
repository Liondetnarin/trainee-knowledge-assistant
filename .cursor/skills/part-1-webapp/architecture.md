# Part 1 — Architecture

## ทำไมเลือก Stack นี้ (สำหรับ timeline 2 วัน)

### SQLite แทน PostgreSQL
- **ข้อดี:** ไฟล์เดียวใน container, ไม่ต้อง service DB แยก, setup เร็ว
- **Trade-off:** ไม่ scale แบบ production — ยอมรับได้ใน assessment
- **เขียนใน DECISIONS.md:** Context = single-user demo, ต้องการ docker compose ง่าย

### Simple Chunking แทน Vector DB (Phase 1)
- **วิธี:** แบ่ง text เป็นชunks ~500–800 chars → เลือก chunks ที่ keyword match กับคำถาม → ส่งใน system prompt
- **ข้อดี:** ผ่าน Required "Chat with Uploaded File Context" ได้, ไม่ต้อง embedding API
- **Trade-off:** ความแม่นยำต่ำกว่า RAG จริง — ระบุใน Known Issues
- **Phase 2 (optional):** เพิ่ม Chroma/Qdrant ถ้า Required ครบและมีเวลา

### iron-session แทน NextAuth
- mock user เดียว (admin/admin123) — NextAuth overkill
- httpOnly cookie, encrypt session

## Data Flow

```
[Upload PDF/TXT]
    → validate → save file → extract text → chunk → store in SQLite

[Chat + document]
    → user question → retrieve top-K chunks → build prompt → AI API
    → response + token count → save message → return to UI
```

## Environment Variables

```env
AI_API_KEY=           # OpenAI หรือ Anthropic
AI_PROVIDER=openai    # openai | anthropic
AI_MODEL=gpt-4o-mini    # หรือ claude-3-haiku
SESSION_SECRET=         # random 32+ chars
DATABASE_URL=file:./data/app.db
UPLOAD_MAX_MB=10
```

## Docker

Root `docker-compose.yml` build จาก `webapp/Dockerfile`:
- mount volume สำหรับ `data/` (SQLite + uploads)
- healthcheck: `GET /api/health`
- คำสั่งเดียว: `docker compose up`
