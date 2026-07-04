---
name: part-1-webapp
description: สร้าง Mini Knowledge Assistant ตาม spec Part 1 — login, upload PDF/TXT, chat AI, file context, token counter, docker. ใช้เมื่อ implement หรือแก้ไข webapp/ หรือ Part 1 coding task.
---

# Part 1 — Mini Knowledge Assistant

## Stack ที่เลือก (monorepo)
| Layer | เลือก | เหตุผล |
|-------|-------|--------|
| Framework | Next.js 14 App Router + TS | API routes ในตัว, ecosystem ใหญ่ |
| DB | SQLite + Drizzle ORM | ไม่ต้อง container DB แยก — เร็วสำหรับ 2 วัน |
| Auth | iron-session + bcrypt | mock user เดียว — ไม่ over-engineer |
| File context | Simple chunking (ไม่ใช้ Vector DB ก่อน) | ผ่าน Required #4 ได้ ประหยัด ~6–8 ชม. |
| PDF | pdf-parse | ง่าย ไม่ต้อง OCR |
| AI | OpenAI หรือ Claude (env `AI_API_KEY`) | สลับได้ผ่าน env |

ดูรายละเอียด architecture: [architecture.md](architecture.md)
ดู checklist คะแนน: [feature-checklist.md](feature-checklist.md)

## Required Features (30 คะแนน — ต้องครบทั้งหมด)

```
Task Progress:
- [ ] 1. Login + Protected Routes (bcrypt + session)
- [ ] 2. Upload PDF/TXT (validate type/size + sanitize path)
- [ ] 3. Chat with AI (error handling + timeout)
- [ ] 4. Chat with Uploaded File Context (chunk + retrieve)
- [ ] 5. Token Usage Counter (per message + session total)
```

## โครงสร้าง webapp/ เป้าหมาย

```
webapp/
├── src/
│   ├── app/
│   │   ├── (auth)/login/page.tsx
│   │   ├── (protected)/
│   │   │   ├── chat/page.tsx
│   │   │   └── upload/page.tsx
│   │   └── api/
│   │       ├── auth/login/route.ts
│   │       ├── auth/logout/route.ts
│   │       ├── chat/route.ts
│   │       └── upload/route.ts
│   ├── lib/
│   │   ├── services/       # chat, upload, auth
│   │   ├── repositories/   # user, document, message, token
│   │   ├── chunking/       # split text + simple retrieval
│   │   └── session.ts
│   └── middleware.ts       # protected routes
├── Dockerfile
└── package.json
```

## Workflow แนะนำ (ลำดับ implement)

1. **Scaffold + Docker** — `docker compose up` รันได้ (healthcheck)
2. **Auth** — login page, bcrypt, session, middleware
3. **Upload** — API + UI, validate, เก็บไฟล์ + extract text
4. **Chat basic** — เรียก AI API, error + timeout
5. **Chat + context** — chunk เอกสาร, ส่ง relevant chunks ใน prompt
6. **Token counter** — นับจาก API response, แสดง UI + session total
7. **Polish** — README, commits, AI_JOURNAL

## Bonus ที่คุ้มเวลา (ถ้า Required ครบแล้ว)
- Streaming response (+3)
- Markdown rendering (+3)
- Docker healthcheck (+3) — ทำพร้อมข้อ 1
- Conversation history (+3)

## Bonus ที่ใช้เวลามาก (ตัดใน 2 วัน)
- RAG + Vector DB (+8) — ทำหลังส่งถ้ามีเวลา
- Unit tests 40% (+5)
- Rate limiting (+3)

## เมื่อใช้ AI
บันทึกใน `AI_JOURNAL.md` ทุก session — ระบุ My Adjustment
