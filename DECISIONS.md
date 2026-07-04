# Architecture Decisions

อธิบาย 3 decisions สำคัญ (แต่ละข้อ ~100–200 คำ)

---

## Decision 1: SQLite แทน PostgreSQL

### Context
Part 1 ต้องรันด้วย `docker compose up` คำสั่งเดียว ภายใน timeline ที่จำกัด (~20 ชม.) และเป็น single-container demo ไม่มีทีม ops คอยดูแล service แยก

### Alternatives Considered
- PostgreSQL ใน container แยก (ต้องเพิ่ม service ใน docker-compose, จัดการ connection string, migration tool)
- JSON file storage (ง่ายกว่า SQLite แต่ไม่มี query/index, เสี่ยง race condition เวลาเขียนพร้อมกัน)

### Why SQLite
SQLite เป็นไฟล์เดียว ไม่ต้องรัน service แยก ลด moving parts ใน `docker-compose.yml` เหลือ container เดียว (ตรง requirement "1-command setup") แต่ยังได้ SQL query, foreign keys, และ index จริงผ่าน Drizzle ORM ต่างจาก JSON file ที่ต้อง implement query logic เอง ใช้ `better-sqlite3` แบบ synchronous ทำให้โค้ด repository เขียนง่ายไม่ต้อง async pool management

### Trade-offs
Single-writer — เขียนพร้อมกันหลาย request จะ block กัน (ยอมรับได้เพราะ traffic ต่ำในบริบท assessment/demo) และไม่ scale ข้ามหลาย container ถ้าต้อง horizontal scale ในอนาคตต้อง migrate ไป PostgreSQL ซึ่ง Drizzle ORM ช่วยลด friction ตรงนี้ได้ระดับหนึ่งเพราะ schema/query syntax ใกล้เคียงกัน

---

## Decision 2: Simple Keyword Chunking แทน Vector DB (Phase 1)

### Context
Required Feature #4 ("Chat with Uploaded File Context", 10 คะแนน) ต้องให้ผู้ใช้ถามคำถามเกี่ยวกับเอกสารที่อัปโหลดได้ ส่วน RAG ด้วย Vector DB จริงเป็น Bonus (+8) แต่ใช้เวลา implement มาก (ต้อง embedding API, vector store, similarity search)

### Alternatives Considered
- Chroma/Qdrant + embeddings — แม่นยำกว่า แต่เพิ่ม dependency ภายนอก, เพิ่ม cost (embedding API), และเพิ่มความซับซ้อนของ docker-compose
- ส่ง full document เข้า prompt ตรงๆ — ใช้ได้กับไฟล์เล็กมากเท่านั้น ไฟล์ใหญ่จะชน context window/token limit ของโมเดลทันที

### Why Simple Chunking
แบ่งเอกสารเป็น chunk ขนาด ~800 ตัวอักษร (overlap 100) แล้วให้คะแนนแต่ละ chunk จากจำนวนคำในคำถามที่ปรากฏใน chunk นั้น (keyword overlap) เลือก top-3 chunk ส่งเป็น context ให้โมเดล วิธีนี้ไม่ต้องเรียก embedding API เพิ่ม ไม่ต้องมี vector store แยก ผ่าน Required Feature ได้ในเวลาจำกัด และ handle เอกสารขนาดใหญ่ได้ในระดับหนึ่งเพราะไม่ต้องส่งทั้งไฟล์

### Trade-offs
ความแม่นยำต่ำกว่า semantic search จริง — คำถามที่ paraphrase ไม่ตรงคำในเอกสาร หรือคำตอบที่กระจายอยู่หลาย chunk ที่ไม่ติด top-3 จะตอบไม่ครบ ระบุไว้ชัดเจนใน README → Known Issues เพื่อไม่ให้ดูเหมือนปกปิดข้อจำกัด

---

## Decision 3: iron-session แทน NextAuth (รองรับ multi-user แบบ mock)

### Context
Spec อนุญาตให้ใช้ mock user ได้ ("admin/admin123") ภายหลังขยายเป็น 4 mock accounts (`admin1`–`admin4`) เพื่อ demo การแยกข้อมูลระหว่าง user แต่ยังไม่ต้องมีระบบ signup/OAuth จริง

### Alternatives Considered
- NextAuth.js — ฟีเจอร์ครบ (OAuth providers, adapters) แต่ over-engineered สำหรับ mock user ล้วนๆ เพิ่ม setup time โดยไม่ได้ประโยชน์ตรงกับ scope
- JWT เก็บใน localStorage — เสี่ยง XSS เพราะ JavaScript อ่าน token ได้โดยตรง ไม่มี httpOnly protection

### Why iron-session
เข้ารหัส session data ใส่ httpOnly cookie โดยตรง ไม่ต้องมี session store แยก (ไม่มี Redis/DB session table) ขนาดไลบรารีเล็ก API ตรงไปตรงมา พอสำหรับ auth แบบ username/password + `userId` ใน session ซึ่งเพียงพอสำหรับแยกข้อมูล (conversations, documents) ต่อผู้ใช้ในทุก query แล้ว

### Trade-offs
ไม่มี OAuth/social login, ไม่มี password reset flow, และ 4 mock accounts ใช้รหัสผ่านเดียวกัน (`admin123`) ซึ่งยอมรับได้สำหรับ local demo แต่ไม่ใช่วิธี provision user จริงในระบบ production
