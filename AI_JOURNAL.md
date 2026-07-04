# AI Usage Journal

> บันทึกทุก session ที่ใช้ AI ช่วยงาน — เป้าหมาย 15–30 sessions  
> แต่ละ entry ต้องมี Prompt + AI Response + **My Adjustment** (ส่วนที่สำคัญที่สุด — แสดงว่าเข้าใจและตัดสินใจเองไม่ใช่ copy-paste)

---

## Session 1: Scaffold โครงสร้างโปรเจกต์

**Prompt:** "ช่วยสร้างโครงสร้าง monorepo สำหรับข้อสอบ Junior Dev — .cursor rules/skills, Next.js webapp, docker-compose"

**AI Response:** สร้าง `.cursor/rules/` 4 ไฟล์ (assignment core, security, git commits, submission docs), `.cursor/skills/` สำหรับ Part 1–4, docs templates, `AGENTS.md`, และ scaffold โปรเจกต์ Next.js เริ่มต้น

**My Adjustment:** _(TODO: ระบุสิ่งที่ปรับเองจริง เช่น เลือก stack ไหนแทนที่ AI เสนอ, แก้ชื่อ folder/ไฟล์ใด, ตัด skill หรือ rule ที่ไม่จำเป็นออก — ควรเติมก่อนส่งงาน เพราะช่องนี้เป็นตัวชี้วัดหลักว่าไม่ได้ปล่อยให้ AI ทำทั้งหมด)_

---

## Session 2: แก้ปัญหา AI ตอบไม่ได้เมื่อถามเกี่ยวกับเอกสาร + ปรับ UX ส่งข้อความด้วย Enter

**Prompt:** "ถามเกี่ยวกับไฟล์เอกสารที่อัปโหลดเข้าไปไม่ได้ อาจเพราะปัญหาเรื่อง limit ของ OpenRouter free — Error: AI returned an unreadable response (HTTP 200)" และ "อยากให้ปรับ UX เมื่อกด Enter คือการกดส่งข้อความ"

**AI Response:** วิเคราะห์ว่าโมเดลฟรีบน OpenRouter บางครั้งตอบกลับมาไม่ครบหรือผิดรูปแบบเมื่อโดน rate limit ที่ยอดฮิตของ platform จึงเพิ่ม retry อัตโนมัติ 1 ครั้งสำหรับ transient error, เพิ่ม `max_tokens` เป็น 1536 ให้โมเดล reasoning มีที่พอเขียนคำตอบ, ลดขนาด context ที่ส่งไป (document chunks 5→3, ประวัติแชท 10→6 ข้อความ) เพื่อลดโอกาสโดน limit และแก้ `ChatPanel` ให้กด Enter ส่งข้อความ / Shift+Enter ขึ้นบรรทัดใหม่

**My Adjustment:** ยืนยันจากการใช้งานจริงว่าปัญหาเกิดจาก rate limit ของ OpenRouter free tier ไม่ใช่บั๊กโค้ด และเป็นคนกำหนด UX requirement (Enter-to-send) เอง

---

## Session 3: Refactor — ลบเอกสารได้, เปลี่ยนเป็น streaming response, Markdown rendering, รองรับ AI provider สำรอง

**Prompt:** "refactor project ใหม่เพื่อเพิ่มประสิทธิภาพโปรเจค: (1) เลือกโมเดลในช่อง chat ได้, (2) ปรับ upload files ให้ลบได้, (3) แนะนำ free API ทางเลือกอื่น เพราะอาจติด limit ของ OpenRouter free, (4) แนะนำ refactor อื่นๆ ที่ควรทำ"

**AI Response:** เพิ่ม `DELETE /api/documents/[id]` ให้ลบไฟล์ + chunks ในฐานข้อมูลได้ (เก็บประวัติแชทไว้โดย set `documentId` เป็น null แทนการลบ), เพิ่มรองรับ provider Groq และ Gemini ผ่าน OpenAI-compatible endpoint ใน `lib/ai/client.ts`, เปลี่ยน `/api/chat` เป็น Server-Sent Events streaming และเพิ่ม Markdown rendering ด้วย `react-markdown` — ตอนแรกยังเพิ่ม model selector ใน UI ด้วย

**My Adjustment:** ทดสอบ end-to-end จริงด้วย curl หลัง implement และพบบั๊กที่ AI มองข้าม — delta text ถูก trim จนช่องว่างระหว่างคำหายไป ("Docker compose" กลายเป็น "Dockercompose") จึงให้แก้ก่อนใช้งานต่อ. เลือกทำเฉพาะ Streaming + Markdown จาก bonus list (ให้คะแนนสูงสุดต่อเวลาที่ใช้) และตัด Rate limiting ออกไปก่อน. เลือกนโยบายลบเอกสารแบบเก็บประวัติแชทไว้ (ไม่ลบ message ที่เคยอ้างอิงเอกสารนั้น) เพราะข้อมูลการสนทนามีค่ามากกว่าการอ้างอิงไฟล์ที่หายไป. หลังทดลองใช้ model selector แล้วเห็นว่าเพิ่ม complexity โดยไม่จำเป็นสำหรับ scope นี้ จึงตัดสินใจถอดออกและกลับไปใช้โมเดลเดียวจาก `AI_MODEL` ใน env

---

## Session 4: ย้ายจาก OpenRouter ไป Groq + ลบโค้ดที่ไม่ใช้แล้ว

**Prompt:** "ตอนนี้ใช้ groq แล้ว เร็วมาก ลบส่วนของ openrouter ออกได้เลย"

**AI Response:** ลบ case `"openrouter"` ออกจาก `getProviderEndpoint()`, ปรับข้อความ error hint ให้เป็น provider-agnostic (ไม่ผูกกับ OpenRouter โดยเฉพาะ) และอัปเดต `.env.example` ให้เหลือแค่ groq/gemini/openai/anthropic เป็นตัวเลือก

**My Adjustment:** ตัดสินใจเปลี่ยน default provider เป็น Groq เองหลังพบว่า rate limit ของ OpenRouter free tier ทำให้แชทกับเอกสารใช้งานไม่ได้บ่อยเกินไปในทางปฏิบัติ

---

## Session 5: Major refactor — multi-conversation sidebar UI, multi-user accounts, citation, rate limiting

**Prompt:** สั่งให้ทำ 4 อย่างพร้อมกัน: (1) ทำ recommendations ที่ค้างไว้ทั้งหมด (README.md, DECISIONS.md, จัด commit, AI_JOURNAL), (2) ปรับ UI ให้เหมือน ChatGPT — มี sidebar แสดงประวัติแชทแต่ละอัน, ปุ่มเพิ่มแชทใหม่, เพิ่ม/ลบไฟล์ได้ในหน้า chat โดยไม่ต้องไปหน้า upload, (3) เปลี่ยนบัญชีเป็น admin1–admin4 พร้อมล้างแคชข้อความทั้งหมด, (4) แนะนำและ implement bonus อื่นที่เพิ่มคะแนนได้

**AI Response:** เพิ่ม `conversations` table ใน schema (แต่ละ `messages` row ผูกกับ `conversationId`) พร้อม repository/service/API routes ใหม่ (`/api/conversations`, `/api/conversations/[id]`), เขียน `ChatPanel.tsx` ใหม่ทั้งหมดเป็น layout แบบ sidebar (รายชื่อแชท + ปุ่ม New chat + document manager แบบ inline ผ่าน component `DocumentSidebar.tsx` ใหม่), เปลี่ยน seed จาก mock user เดียวเป็น `admin1`–`admin4`, เพิ่ม citation (บอกว่า chunk ไหนของเอกสารถูกใช้ตอบ) และ rate limiting แบบ in-memory (20 req/นาที/user) เป็น bonus เพิ่มเติม, ลบ local SQLite db เก่าทิ้งเพื่อ migrate schema และ clear ข้อความทั้งหมดตามที่ขอ, เขียน README.md/DECISIONS.md ให้ตรง spec (มี Tech Stack, Setup, Features Done, Architecture, Known Issues และ 3 decisions พร้อมเหตุผลจริง)

**My Adjustment:** ตัดสินใจให้ documents ยังคงผูกกับ user ไม่ใช่ผูกกับ conversation เดียว (เพื่อให้ทุกแชทของ user เดียวกันเลือกใช้เอกสารเดิมได้ ไม่ต้องอัปโหลดซ้ำ) — เป็นการลด scope ให้เหมาะกับเวลาที่มี แทนที่จะทำ per-conversation document scoping ที่ซับซ้อนกว่า. เลือก schema migration แบบ "ลบ db ไฟล์เก่าทิ้งแล้วสร้างใหม่" แทนการเขียน migration script เพราะ user ขอให้ล้าง cache อยู่แล้วและเป็น local dev database ไม่ใช่ production data — ตรวจสอบก่อนว่าไฟล์ที่จะลบเป็นแค่ dev db จริงไม่ใช่ของที่ยังต้องการเก็บ. ทดสอบ backend ทุก endpoint ด้วย curl จริง (login แยก user, สร้าง/ลบ conversation, citation, rate limit จนโดน 429 จริง) ก่อนสรุปว่าเสร็จ — พบว่าไม่มี headless browser tool ในเครื่องนี้เลยตรวจ UI ด้วยการอ่านโค้ด + type-check + build แทนการ screenshot จริง จึงแจ้ง user ตรงๆ ว่ายังไม่ได้ verify ด้วยตาเรื่อง layout

---

<!-- คัดลอก template ด้านล่างสำหรับ session ถัดไป -->

## Session N: _(ชื่อ task)_

**Prompt:**

**AI Response:**

**My Adjustment:**
