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

## Session 6: Bug — login พังทั้งระบบหลัง deploy จริง (`no such column: conversation_id`)

**Prompt:** ส่ง error log จาก browser console ตรงๆ: `POST /api/auth/login 500 — no such column: conversation_id`

**AI Response:** วินิจฉัยว่า Docker volume (`app-data`) ที่รันอยู่ก่อนหน้ามีตาราง `messages` แบบ schema เก่า (ไม่มีคอลัมน์ `conversation_id`) จาก session ก่อนที่เพิ่ง migrate — `CREATE TABLE IF NOT EXISTS` ไม่เพิ่ม column ให้ตารางที่มีอยู่แล้ว ทำให้ `CREATE INDEX ... ON messages(conversation_id)` พังตั้งแต่ตอน `getDb()` เริ่มทำงาน กระทบทุก request รวมถึง login แก้โดยเพิ่ม self-healing migration ใน `db/index.ts` — เช็คก่อนว่า `messages` table เป็น schema เก่าไหม (ไม่มีคอลัมน์ `conversation_id`) ถ้าใช่ให้ `DROP TABLE` แล้วปล่อยให้ `CREATE TABLE IF NOT EXISTS` สร้างใหม่ตาม schema ปัจจุบัน

**My Adjustment:** ก่อนสรุปว่าแก้ถูก จำลอง database แบบ schema เก่าขึ้นมาจริง (เขียน script สร้างตาราง `messages` แบบไม่มี `conversation_id`) แล้วรัน dev server ทับเพื่อพิสูจน์ว่า migration ทำงานจริงและ login/chat ผ่านได้ — ไม่ใช่แค่เชื่อ diagnosis เฉยๆ

---

## Session 7: ตรวจสอบงานที่ทำไป + แก้บั๊กเล็กน้อย + คำถามเรื่องการส่งงาน

**Prompt:** (1) ให้แสดงชื่อไฟล์เอกสารในข้อความ hint แทนคำว่า "sidebar" เฉยๆ, (2) ถามว่าหน้า /upload ยังจำเป็นไหม, (3) ให้ตรวจ TASK.md เทียบกับสถานะจริงและหา bug, (4) ถามว่ามี bonus อะไรจากเอกสารโจทย์ที่ยังทำได้อีก, (5) ถามเรื่องการส่ง `.env` ให้ผู้ตรวจหรือไม่

**AI Response:** เพิ่ม callback `onDocumentsChange` ใน `DocumentSidebar` ให้ `ChatPanel` รู้จักชื่อไฟล์ที่เลือกอยู่ (ไม่ใช่แค่ id), แก้ให้ sidebar sync ลำดับแชทหลังทุกข้อความ (เดิม refresh แค่ข้อความแรก), เจอและลบ `getMessagesByConversationId` ที่เป็น dead code ไม่มีใครเรียกใช้ในระหว่างตรวจโค้ด, ยืนยันว่านับ commit ได้ 20 (ผ่านเกณฑ์ ≥10 แล้ว), และอธิบายว่าหน้า `/upload` ยังจำเป็นเพราะ spec ระบุ "Upload Page" เป็นหนึ่งใน 3 หน้าหลักที่ต้องมี (ไม่ใช่แค่ฟีเจอร์อัปโหลด) จึงแนะนำเก็บไว้แทนลบ

**My Adjustment:** ตรวจ usage ของทุก export ใน repository ด้วย `grep` จริงก่อนตัดสินใจลบ dead code แทนการเดา, ปฏิเสธคำแนะนำ (ที่อาจดูสมเหตุผล) ที่จะลบหน้า /upload เพราะขัดกับ required feature ของโจทย์ตรงๆ — เลือกทำตาม spec แทนตาม UX ที่ดูสวยกว่า

---

## Session 8: แก้ UX — ต้องเอาเมาส์ไปคลิกช่อง input ใหม่ทุกครั้งหลังส่งข้อความ

**Prompt:** "เวลาพิมพ์คำถามใน input หน้า /chat เมื่อกดส่งคำถามไปแล้วจะต้องมาใช้เมาส์กดที่ช่อง input อีกครั้งเพื่อพิมพ์ ... UX ไม่ดีเลย"

**AI Response:** วิเคราะห์ว่าสาเหตุคือ (1) การกดปุ่ม "Send message" ด้วยเมาส์ทำให้ focus ย้ายไปอยู่ที่ปุ่มแทน textarea และ (2) textarea เดิมมี `disabled={loading}` ทำให้ browser blur ช่อง input ออกโดยอัตโนมัติระหว่างรอ AI ตอบ พอ enable กลับมา focus ก็ไม่ถูกคืนให้เอง แก้โดยเพิ่ม `textareaRef` แล้วเรียก `.focus()` กลับไปที่ช่อง input หลังส่งข้อความทุกครั้ง (ทั้ง path ปุ่มกดและ Enter), เปลี่ยนจาก `disabled={loading}` เป็น `disabled={conversationsLoading}` เพื่อให้พิมพ์ข้อความถัดไปได้ทันทีระหว่างที่ยัง stream คำตอบอยู่ (แบบ ChatGPT) แทนที่จะ block ช่อง input ทั้งช่วง และเพิ่มการคืน focus ให้ตอนสลับ/สร้าง/ลบแชทด้วยเช่นกัน เพื่อความสม่ำเสมอ

**My Adjustment:** เลือกไม่ disable textarea ระหว่างรอคำตอบเลย (แทนที่จะ disable แล้วค่อย refocus ตอนเสร็จ) เพราะให้ UX ที่ลื่นกว่า — ผู้ใช้พิมพ์คำถามถัดไปต่อได้เลยระหว่างรอ ส่วนการป้องกัน race condition (ส่งซ้ำ/ส่งก่อนพร้อม) ยังมีอยู่ผ่าน guard เดิมใน `sendMessage()` (เช็ค `loading` และ `activeConversationId`) จึงไม่ต้องเพิ่ม state ใหม่

---

## Session 9: วางแผนการเขียน Part 3–4 (ยังไม่เขียนคำตอบจริง)

**Prompt:** "ช่วยทำ plan Part3 และ Part4 เป็นไฟล์ .md ให้หน่อย โดยรายละเอียดและ scope งานดูจาก `.cursor/` และ `docs/`"

**AI Response:** สร้าง `docs/part-3-plan.md` และ `docs/part-4-plan.md` เป็น outline + timeline + checklist เทียบ rubric/red flags — โดย AI เลือกเองที่จะไม่เขียนคำตอบสำเร็จรูปให้ เพราะโจทย์ระบุชัดว่า "เนื้อหาเป็น AI 100%" เป็นสัญญาณที่ผู้ตรวจจับ

**My Adjustment:** เห็นด้วยกับแนวทางแยก "แผน" ออกจาก "คำตอบจริง" และใช้ไฟล์ plan เป็นแค่กรอบคิด — ตัดสินใจว่าเนื้อหาคำตอบจริงต้องมาจาก draft ที่เขียนเองก่อนเสมอ

---

## Session 10: Part 3 draft แรก — ให้ AI ถามคำถามสั้น ๆ เพื่อรู้จักตัวตนก่อนเขียน

**Prompt:** "จากแผนที่มี ช่วยกรองเนื้อหาด้วยมุมมองของตัวผมเองและนำไปใส่ในไฟล์คำตอบจริง โดยให้ถามทดสอบเป็นคำถามให้ผมเพื่อที่จะได้รู้จักตัวตนผมมากขึ้น"

**AI Response:** ถามคำถามเชิงตัวเลือก 8 ข้อ (สไตล์สอนงาน, วิธีจัดการ low performer, วิธีวัดผล, เหตุผล retention, ประสบการณ์ legacy, ปฏิกิริยากับ prod ที่ไม่มีเอกสาร, ไฟล์แปลก, โทนการคุยกับพี่ในทีม) แล้วเขียน draft ทั้ง Part 3 และ Part 4 จากคำตอบ

**My Adjustment:** หลายข้อไม่เลือกตัวเลือกที่ AI ให้ แต่พิมพ์คำตอบเองแทน เช่น วิธีวัดผล — ตอบเองว่า "แนวทางแก้ปัญหาที่ชัดเจนถูกต้อง (เกินครึ่ง) สำคัญกว่าจำนวน" ซึ่งกลายเป็นแกนของหมวดวิธีวัดผลในเอกสาร

---

## Session 11: เขียนแผน Part 3 ด้วยตัวเองทั้งหมด แล้วให้ AI จัดโครงเข้า template

**Prompt:** "ช่วยอ่าน `part-3-plan.md` และเอกสารที่เขียนเองด้วยความเป็นตัวของตัวเองใน `part-3-mine.md` เพื่อนำไปแก้ไขใน `part-3-leadership.md` โดยคำนึงถึง rules/skills และเกณฑ์ให้คะแนน"

**AI Response:** ใช้ draft ลายมือของผมเป็นแหล่งหลัก (control variable เรื่อง AI เท่ากันทุกคน, จำแนกคน 2 แกนความสามารถ+อุปนิสัย, การจัดการคนเก่งนำโด่ง/คนช้ากว่า) จัดเข้าโครง 7 หัวข้อตาม template และชี้ว่าหมวดไหนใน rubric ยังขาด (KPI ตัวเลข, Vision 3–5 ปี, Plan B)

**My Adjustment:** จุดสำคัญของ session นี้คือกลับด้าน workflow — แทนที่จะรับ draft ของ AI มาแก้ ผมเขียน `part-3-mine.md` เองทั้งหมดก่อน (แผนจำแนกคน, mini project, การจัดการช่องว่างระหว่างคนเก่ง/คนช้า) แล้วให้ AI ทำหน้าที่แค่ restructure เพื่อให้เนื้อหายังเป็นความคิดตัวเองจริง

---

## Session 12: Audit ความเป็นตัวเองใน Part 3 ก่อนถือว่าเสร็จ

**Prompt:** "มีความเป็นตัวเองใน part-3-mine.md ที่เขียนเองหรือยัง มากน้อยแค่ไหน / จัด layout ให้อ่านง่าย / ตอบโจทย์เกณฑ์คะแนนหรือยัง ถ้ายังต้องปรับอะไร"

**AI Response:** รายงานเป็นตารางต่อหมวดว่าสัดส่วนไหนมาจาก draft ผมจริง หมวดไหน AI เติม (วิธีวัดผล ~50%, Plan B 0%) พร้อมใส่ `TODO(confirm)` ในไฟล์ทุกจุดที่เป็นการเดาของ AI และยอมรับว่าเคยเขียนหมวด retention ผิดจากคำตอบที่ผมให้ไว้ แล้วแก้กลับ

**My Adjustment:** ไม่รับการเดาของ AI ทั้งก้อน — ตอบยืนยันทีละจุด (KPI เอาแบบตัวเลขชัด, Plan B มองเป็นความผิดพลาดการสื่อสาร/feedback ของตัวเองก่อน ไม่โทษ trainee) แล้วให้แก้เฉพาะจุดนั้นจนไม่มี TODO ค้าง

---

## Session 13: Part 4 — แก้ draft เองก่อน แล้วให้ AI รวมเข้าไฟล์จริง

**Prompt:** "ช่วยอ่าน `part-4-plan.md` และเอกสารที่เขียนเองส่วนหนึ่งใน `part-4-mine.md` เพื่อนำไปแก้ไขใน `part-4-legacy.md` โดยคำนึงถึงเกณฑ์คะแนน bonus และ tips"

**AI Response:** รวม draft ที่ผมแก้เข้าไฟล์จริง และเพิ่มส่วนเก็บ bonus ตาม rubric (Plan B ขอเวลาเพิ่มแทนรีบสรุป, AI Journal 2 sessions ท้ายเอกสาร)

**My Adjustment:** ก่อนสั่งรวม ผมแก้ `part-4-mine.md` เองหลายจุดจาก draft ที่ AI ประเมินตัวตนไว้ — เขียน Day 1–3 ใหม่เป็นลำดับของตัวเอง, เพิ่มมุมที่ AI มองข้ามว่าไฟล์ .php ใน `images/` อาจเป็นไฟล์จัดการรูปปกติ ไม่ใช่ malware เสมอไป (AI ตอบเอียงไปทาง security ฝ่ายเดียว), และเพิ่ม prompt ตัวอย่างเรื่อง deploy feature ใหม่โดยไม่กระทบ user ซึ่งเป็น 1 ใน 3 ปัญหาของลูกค้าที่ draft เดิมไม่มี

---

## Session 14: เตรียมส่งงาน — อัปเดต checklist, README, และสร้าง hub รวมเอกสาร

**Prompt:** "อัปเดต TASK.md ทำเสร็จหมดแล้ว / อัปเดตไฟล์ .md อื่น ๆ / แนะนำแนวทางการส่งงาน / อยากได้ docs รวมทั้งหมดเป็น HTML อ่านง่าย มี FAQ เรื่อง Live interview, live bug fix"

**AI Response:** อัปเดต TASK.md + README แต่จับได้ว่า TASK ติ๊ก "ใส่ link วิดีโอ" ทั้งที่ยังไม่มี URL จริงในไฟล์ไหนเลย จึงไม่ติ๊กให้และเตือนแทน, เพิ่ม bonus features ที่ทำแล้วเข้า README (เดิมโชว์แค่ required), สร้าง `assessment-hub.html` รวมสรุปทุก Part + FAQ เตรียมสัมภาษณ์ และเพิ่มเข้า `.gitignore` เพราะมีแนวตอบสัมภาษณ์ที่ไม่ควรอยู่บน repo public

**My Adjustment:** ยกเลิกการ publish หน้า hub ขึ้น cloud artifact — เลือกเก็บเป็นไฟล์ local แทนเพื่อคุมว่าเอกสารเตรียมสัมภาษณ์ไม่หลุดไปไหน และกำหนด design เองว่าไม่ใช้ emoji ในหน้าเอกสาร ให้ใช้ icon แบบ SVG แทน

---

## Session 15: แปล webapp/README เป็นภาษาไทย + sync ข้อมูลที่ขัดกันระหว่างเอกสาร

**Prompt:** "webapp/README.md ทำเป็นภาษาไทยเป็นหลัก / ตรวจสอบแนะนำอื่น ๆ เพิ่ม / commit + push แยก logical unit"

**AI Response:** ก่อนแปล ตรวจพบว่า root README กับ webapp README ขัดกันเอง (Next.js 14 vs 16, mock user `admin` vs `admin1`–`admin4`) จึงเช็คจาก `package.json` และ `seed.ts` ก่อนสรุปว่าฝั่ง webapp ถูก แล้วแก้ root README ให้ตรงโค้ดจริง พร้อมแปล webapp README เป็นไทยโดยคงศัพท์เทคนิคเป็นอังกฤษ

**My Adjustment:** กำหนดเองว่าภาษาไทย "เป็นหลัก" ไม่ใช่แปลทุกคำ — ศัพท์เทคนิค (streaming, chunking, middleware) คงเป็นอังกฤษเพื่อให้ dev อ่านแล้วเข้าใจตรงกัน

---

<!-- คัดลอก template ด้านล่างสำหรับ session ถัดไป -->

## Session N: _(ชื่อ task)_

**Prompt:**

**AI Response:**

**My Adjustment:**
