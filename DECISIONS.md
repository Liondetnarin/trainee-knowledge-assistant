# Architecture Decisions

อธิบาย 3 decisions สำคัญ (แต่ละข้อ 100–200 คำ)

---

## Decision 1: SQLite แทน PostgreSQL

### Context
Part 1 ต้อง `docker compose up` เดียวจบ ใน timeline 2 วัน

### Alternatives Considered
- PostgreSQL ใน container แยก
- JSON file storage

### Why SQLite
_(เขียน reasoning ของคุณ — 1 ไฟล์, ไม่ต้อง service DB, พอสำหรับ demo)_

### Trade-offs
_(single-writer, ไม่ scale production — ยอมรับได้ใน assessment)_

---

## Decision 2: Simple Chunking แทน Vector DB (Phase 1)

### Context
Required feature #4 ต้อง chat กับเอกสารที่ upload — Bonus RAG 8 คะแนนแต่ใช้เวลามาก

### Alternatives Considered
- Chroma / Qdrant + embeddings
- ส่ง full document ใน prompt (ไฟล์เล็ก)

### Why Simple Chunking
_(แบ่ง chunk + keyword match — เร็ว, ไม่ต้อง embedding API)_

### Trade-offs
_(ความแม่นยำต่ำกว่า RAG จริง — ระบุใน Known Issues)_

---

## Decision 3: iron-session แทน NextAuth

### Context
Spec กำหนด mock user เดียว (admin/admin123)

### Alternatives Considered
- NextAuth.js
- JWT ใน localStorage

### Why iron-session
_(httpOnly cookie, encrypt session, พอสำหรับ single user)_

### Trade-offs
_(ไม่มี OAuth, ไม่มี multi-user — ไม่จำเป็นใน scope นี้)_
