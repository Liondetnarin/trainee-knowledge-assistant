# เอกสารต้นฉบับ — Junior Dev Assessment 2026

> ไฟล์อ้างอิงจากโจทย์ที่ได้รับมอบ (ไม่ใช่งานส่ง)  
> สรุปกฎและ workflow อยู่ใน `.cursor/rules/` และ `TASK.md`

---

# Dev Assessment  
**Mini Knowledge Assistant**

| 4 Parts \+ Bonus | 195 คะแนนเต็ม  (+15 bonus) | 5 วัน | 110 เกณฑ์ผ่าน |
| :---: | :---: | :---: | :---: |

 

| เกี่ยวกับการบ้านนี้ การบ้านนี้แบ่งเป็น 4 Parts หลัก \+ Bonus รวม 195 คะแนน (180 \+ 15 bonus) ทดสอบทั้งทักษะ coding, การสื่อสารกับลูกค้า, ภาวะผู้นำ และ วิธีคิดกับ legacy system — เราสนใจ วิธีคิดและความซื่อสัตย์ทางปัญญามากกว่าการทำครบทุกข้อแบบผิวเผิน |
| :---- |

 

| Deadline ส่งภายใน 5 วัน นับจากเวลาที่ได้รับข้อสอบ (เพิ่มจาก 4 วัน เนื่องจากเพิ่ม Part 4\) |
| :---- |

 

# 

# **ภาพรวมของการบ้าน**

| Part | เนื้อหา | คะแนน | เวลาที่แนะนำ |
| :---: | ----- | :---: | :---: |
| Part 1 | Coding Task (Next.js / Nuxt.js) | 65 | \~20 ชั่วโมง |
| Part 2 | Business Scenario Video | 35 | \~3 ชั่วโมง |
| Part 3 | Leadership Reflection | 20 | \~3 ชั่วโมง |
| Part 4 | Legacy System Thinking (ใหม่) | 20 | \~4 ชั่วโมง |
| Bonus | AI Usage Journal (Part 1\) | \+10 | ต่อเนื่อง |
| Quality | Green Flags (Code Quality) | \+5 | — |
| รวม | 180 คะแนน \+ 15 bonus | 195 | \~30 ชั่วโมง |

 

| Tip ไม่จำเป็นต้องทำครบ 100% — เราสนใจคุณภาพมากกว่าปริมาณ ทำ Part ที่คุณถนัดที่สุดให้ดีที่สุดดีกว่าทำครบแต่ผิวเผินทุก Part |
| :---- |

 

## 

## **กติกา**

| \[อนุญาต\] สิ่งที่อนุญาต | \[ห้าม\] สิ่งที่ห้ามเด็ดขาด |
| ----- | ----- |
| ใช้ AI (ChatGPT, Claude, Copilot, Cursor) ได้เต็มที่ | ให้คนอื่นทำแทน (เราตรวจจับได้จาก Git history \+ Live session) |
| ใช้ library / framework อะไรก็ได้ | Copy repo ของคนอื่นมาแปะชื่อตัวเอง |
| ถาม Google / Stack Overflow ได้ | Submit repo ที่ทำไว้ก่อนได้รับโจทย์ |
| ใช้ template / boilerplate ได้ (ต้องระบุใน README) | — |

 

### **สิ่งที่เราจะตรวจ (นอกจาก Feature)**

• 	**Git commit history** — commit เป็นขั้นตอนหรือก้อนเดียว?

• 	**Code quality** — โครงสร้างเป็นระบบไหม?

• 	**Security basics** — มี vulnerability ไหม?

• 	**AI Journal** — ใช้ AI ยังไง?

• 	**Documentation** — README เขียนดีไหม?

• 	**วิธีคิดกับของเก่า** — Part 4 วัดว่าคุณเข้าหา legacy system แบบไหน

 

| PART 1 | Coding Task: Mini Knowledge Assistant \~20 ชั่วโมง | 65 คะแนน |
| :---: | :---- | :---: |

 

## **โจทย์**

สร้าง web application ที่:

1\.   **Login Page** (ใช้ mock user ได้ — admin/admin123)

2\.   **Chat Page** คุยกับ AI (ใช้ Claude API / OpenAI API หาตัวฟรีหรือตัวอื่นทดแทนได้เลย)

3\.   **Upload Page** — upload เอกสาร (PDF/TXT) แล้วถามคำถามเกี่ยวกับเอกสารได้

4\.   **Token Usage** — แสดง token ที่ใช้ในแต่ละข้อความ

 

### **Tech Stack**

| Frontend | Next.js หรือ Nuxt.js (เลือก 1\) |
| :---- | :---- |
| **Backend** | API routes ของ Next.js/Nuxt.js หรือแยก backend ก็ได้ |
| **Database** | อะไรก็ได้ (SQLite, PostgreSQL, MongoDB, JSON file) |
| **Vector DB** | (ถ้าทำ RAG): Chroma, Pinecone, Qdrant, หรืออื่น ๆ |
| **Deploy** | Docker Compose (ต้องรันด้วย docker compose up เดียว) |

 

### 

### **Required Features (30 คะแนน — ต้องทำทั้งหมด)**

| \# | Feature | คะแนน | เกณฑ์คะแนนเต็ม |
| :---: | ----- | :---: | ----- |
| 1 | Login \+ Protected Routes | 5 | ครบ \+ secure (bcrypt, session mgmt) |
| 2 | Upload File (PDF, TXT) | 5 | ครบ \+ validate type/size \+ sanitize path |
| 3 | Chat with AI (basic) | 5 | ครบ \+ error handling \+ timeout |
| 4 | Chat with Uploaded File Context | 10 | ครบ \+ ทำงานแม่นยำ \+ handle ไฟล์ใหญ่ |
| 5 | Token Usage Counter | 5 | ครบ \+ แสดง total ต่อ session |

 

### 

### **Bonus Features (20 คะแนน — เลือกทำ cap ที่ 20\)**

| \# | Feature | คะแนน |
| :---: | ----- | :---: |
| A | Markdown rendering ในคำตอบ AI | 3 |
| B | Citation (แสดงที่มาของคำตอบจากเอกสาร) | 5 |
| C | Streaming response | 3 |
| D | RAG with Vector DB (chunking \+ embedding \+ retrieval) | 8 |
| E | Conversation history (save/load) | 3 |
| F | Rate limiting / API key rotation | 3 |
| G | Docker Compose \+ Healthcheck | 3 |
| H | Unit tests (coverage ≥ 40%) | 5 |

 

### **Code Quality (15 คะแนน — ประเมินจากการอ่านโค้ด)**

| มิติ | คะแนน | เกณฑ์คะแนนเต็ม |
| ----- | :---: | ----- |
| Code Structure & Clean Code | 5 | มี layering (route/service/repo), naming ดี, ไม่มี god file |
| Security Hardening | 5 | input validation \+ no hardcoded key \+ CORS \+ sanitization ครบ |
| Git Commit History | 5 | commit แยกขั้นตอน, message เขียนดี, logical unit |

## **สิ่งที่ต้องส่งใน Part 1**

### **1\. GitHub Repository (Public)**

URL format:

| https://github.com/{username}/trainee-knowledge-assistant |
| :---- |

 

### **2\. README.md (บังคับ)**

ต้องมีอย่างน้อย:

| \# Knowledge Assistant   \#\# Tech Stack \[framework, database, vector DB\]   \#\# Setup & Run \[1-command setup, e.g. docker compose up\]   \#\# Features Done \- \[x\] Login \+ Protected Routes \- \[x\] File Upload \- \[ \] RAG (not done yet)   \#\# Architecture \[brief architecture description\]   \#\# Known Issues \[things you know are not great yet\] |
| :---- |

 

### **3\. AI\_JOURNAL.md (บังคับ — มีผลต่อคะแนน Bonus)**

Template:

| \# AI Usage Journal   \#\# Session 1: Setting up Next.js project \*\*Prompt:\*\* "help me setup next.js 14 with typescript and tailwind" \*\*AI Response:\*\* \[short summary of what AI replied\] \*\*My Adjustment:\*\* \[what you changed, e.g. version, added ESLint\]   \#\# Session 2: Implementing file upload \*\*Prompt:\*\* ... \*\*AI Response:\*\* ... \*\*My Adjustment:\*\* ... |
| :---- |

 

เกณฑ์คะแนน Bonus (10 คะแนน):

| จำนวน Sessions | คะแนน | ความหมาย |
| ----- | :---: | ----- |
| 0 sessions | 0 | ไม่มีไฟล์ |
| 1-4 sessions | 2 | น่าสงสัยว่าทำเองทั้งหมด |
| 5-14 sessions | 5 | พอใช้ |
| 15-30 sessions | 8 | Ideal — ใช้ AI เป็น |
| 30+ sessions | 6 | ต้องดู quality |

 

*\+2 คะแนน ถ้ามี "My Adjustment" ชัดเจนในเกือบทุก session*

### **4\. DECISIONS.md (บังคับ)**

อธิบาย 3 decision สำคัญที่คุณเลือก (แต่ละข้อ 100-200 คำ):

| \# Architecture Decisions   \#\# Decision 1: Chose SQLite over PostgreSQL   \#\#\# Context \[describe the situation\]   \#\#\# Alternatives Considered \[other options you looked at\]   \#\#\# Why SQLite \[reasoning behind the choice\]   \#\#\# Trade-offs \[what you're willing to give up\] |
| :---- |

 

| PART 2 | Business Scenario: Video Response \~3 ชั่วโมง | 35 คะแนน |
| :---: | :---- | :---: |

 

## 

## **Scenario**

อัดวิดีโอ **3 นาที (ไม่ควรเกิน)** ตอบ scenario ต่อไปนี้:

 

สมมุติคุณทำงานเป็น Dev ของบริษัทเรา 6 เดือน แล้วได้รับมอบหมายให้ดูแลลูกค้ารายใหญ่ (บริษัท ABC) วันหนึ่ง — ลูกค้าโทรมาด้วย tone เสียงโกรธ:

| *"คุณครับ\! ระบบที่คุณทำให้พวกเราใช้มา 2 เดือนแล้ว วันนี้ใช้ไม่ได้เลย\! ผมกำลัง demo ให้ผู้บริหาร เสียหน้ามาก\! ตกลงผมจ่ายเงินมา 500,000 บาทเพื่ออะไร? ถ้าไม่แก้ภายในวันนี้ ผมจะยกเลิกสัญญาและฟ้องเรียกค่าเสียหาย\!"* |
| :---- |

 

คุณเช็คแล้วพบว่า:

• 	ระบบทำงานปกติดี (ไม่มีปัญหา technical)

• 	ปัญหาจริงคือ: ลูกค้าป้อน credential ผิด

• 	พี่ในทีมเพิ่งรีเซ็ต password ตามที่ลูกค้าขอเมื่อวาน แต่ลืมแจ้งลูกค้าว่ารหัสใหม่

 

| คำถาม คุณจะจัดการสถานการณ์นี้ยังไง? ตั้งแต่วินาทีแรกที่รับสาย |
| :---- |

 

### **วิธีอัดวิดีโอ**

• 	ใช้มือถือ/notebook อัดได้ — คุณภาพไม่ต้องดีมาก

• 	พูดภาษาไทยหรืออังกฤษก็ได้

• 	ไม่ต้องแต่งตัวทางการ แต่ไม่ควร casual จนดูไม่เคารพ

• 	ตอบเป็นคนพูด ไม่ใช่อ่านสคริปต์

• 	Upload ไปที่ YouTube (Unlisted) หรือ Google Drive (แชร์ view)

 

### **เกณฑ์คะแนน (35 คะแนน)**

| มิติ | คะแนน | เกณฑ์คะแนนเต็ม |
| ----- | :---: | ----- |
| Emotional Management | 8 | calm, empathetic, professional |
| Problem Solving Approach | 8 | step-by-step ชัด, มี priority, มี follow-up |
| Communication Skill | 8 | พูดชัด, tone professional, โครงสร้างดี |
| Accountability | 6 | ขอโทษในนามบริษัท, ไม่โยน, focus แก้ปัญหา |
| Bonus | \+5 | ประทับใจเป็นพิเศษ |

 

### **Bonus ที่เราประทับใจ (+1 คะแนน/ข้อ, สูงสุด \+5)**

• 	ขอเบอร์โทรกลับใน 10-15 นาที (ซื้อเวลาสืบสวน) แทนแก้ปัญหาสด

• 	เสนอ follow-up email สรุปเหตุการณ์ \+ prevention plan

• 	ไม่ด่าพี่ที่ลืมแจ้ง แต่จะคุยเมื่อแก้ปัญหาจบ

• 	เสนอ compensation หรือ goodwill gesture

• 	คิดถึง root cause analysis

| PART 3 | Leadership Reflection \~3 ชั่วโมง | 20 คะแนน |
| :---: | :---- | :---: |

 

## 

## **โจทย์**

เขียนเอกสาร **500-1,000 คำ** (Google Doc หรือ Markdown) ตอบคำถาม:

 

| *"ถ้าคุณผ่านการคัดเลือก และได้ทำงานประจำหลังฝึกงาน 4 เดือน บริษัทมีแผนจะรับ Trainee รุ่นถัดไปอีก 5 คน โดยให้คุณเป็นคนดูแลและ onboard พวกเขา จงเขียนแผนการ onboard Trainee 5 คนนี้ตลอด 4 เดือน ให้ได้ผลงานดีที่สุด พวกเขาเติบโตเร็วที่สุด และ retain อย่างน้อย 3/5 คน รวมถึง: สิ่งที่คุณจะทำในสัปดาห์แรก, การวัดผล, วิธีจัดการกับคนที่ performance ต่ำ, เป้าหมายสุดท้ายที่วัดได้"* |
| :---- |

 

### **เกณฑ์คะแนน (20 คะแนน)**

| มิติ | คะแนน | เกณฑ์คะแนนเต็ม |
| ----- | :---: | ----- |
| มีโครงสร้างชัดเจน | 5 | week-by-week breakdown, หัวข้อชัด |
| Realistic (ทำได้จริง) | 5 | realistic \+ เข้าใจข้อจำกัด \+ มี plan B |
| มีวิธีวัดผล | 4 | measurable goals ชัดเจน (PR merged, coverage, etc.) |
| เข้าใจ Human Side | 3 | จัดการ low performer ด้วย empathy |
| Vision | 3 | มองไกล (3-5 ปี), เป้าหมายใหญ่ |

 

### 

### **Tips**

• 	**ห้ามเขียนแบบ "ตำรา HR" ลอย ๆ** — เราอยากเห็นความคิดของคุณ

• 	**ยกตัวอย่างสถานการณ์** (เช่น "ถ้า Trainee คนหนึ่งส่งงานไม่ทันตลอด ผมจะ...")

• 	**มี measurable goals** (เช่น "สัปดาห์ที่ 4 Trainee ต้อง merge PR แรกได้")

• 	**ถ้ามี diagram/timeline จะดีมาก** (ไม่บังคับ)

 

| PART 4 | Legacy System Thinking \~4 ชั่วโมง | 20 คะแนน |
| :---: | :---- | :---: |

 

| Part ใหม่ Part นี้ ไม่วัดความรู้ Windows/PHP/security มาก่อนหรือไม่ — เราดู วิธีคิดล้วน ๆ ว่าคุณเข้าหาของที่ไม่เข้าใจยังไง |
| :---- |

 

## **Scenario**

เขียนเอกสาร **400-800 คำ** (Markdown หรือ Google Doc) ตอบ scenario ต่อไปนี้:

 

| *สมมุติคุณผ่านการคัดเลือก ทำงานประจำได้ 3 เดือน พี่ในทีมส่งงานมาให้ดู: "น้องลองดูระบบนี้ให้หน่อย เป็นเว็บของลูกค้าเก่า 10 ปี ทีม dev ชุดเดิมลาออกไปหมดแล้ว ไม่มีเอกสาร ไม่มี test ไม่มีใครเข้าใจระบบนี้ ลูกค้ามี 3 เรื่อง — เว็บช้า, admin เจอไฟล์แปลกใน server, และอยาก deploy feature ใหม่แต่ไม่มีคนกล้า" "พี่ไม่ได้คาดหวังให้น้องแก้จบวันนี้ แค่อยากเห็นว่าถ้าเป็นน้องจะเริ่มยังไง"* |
| :---- |

 

### **ข้อมูลที่มี**

• 	**3 Windows Server** เก่า OS \~5 ปี, PHP framework เก่า, DB แยกอีกเครื่อง

• 	**Deploy ด้วย tool เก่า** \+ copy ไฟล์ไปมา 3 server

• 	**AI tool ครบ** (Claude, ChatGPT, Cursor, Copilot), RDP ได้ทุกเครื่อง

• 	**เวลา 2 สัปดาห์** ทำ discovery \+ propose plan

• 	**ระบบยังมี user ใช้อยู่** — พลาดแรง ๆ \= กระทบลูกค้า

 

## **คำถามที่ 1: "น้องจะเริ่มจากตรงไหน" (10 คะแนน)**

เล่าว่า **3 วันแรก** คุณจะทำอะไร:

• 	ลำดับความสำคัญ (ข้อไหนก่อน-หลัง เพราะอะไร)

• 	ใช้ AI ยังไงบ้าง — แนบ prompt ตัวอย่าง 1-2 อัน

• 	ถ้ามีเรื่องที่ไม่รู้ จะถามใคร/ถามอะไร

• 	เรื่องที่กังวล เช่น กลัวรัน command แล้วพัง prod

• 	จบ 3 วัน จะส่งมอบอะไรให้พี่ดู

 

## **คำถามที่ 2: "เจอไฟล์แปลก จะทำยังไง" (10 คะแนน)**

พี่ส่ง screenshot ไฟล์ .php ที่อยู่ใน folder images/ มาให้ — code ข้างในถูก obfuscate อ่านไม่ออก

 

| *พี่ถาม: "น้องคิดว่าคืออะไร ลบได้เลยไหม"* |
| :---- |

 

ตอบพี่ให้ฟังเหมือนคุยกันจริง:

• 	คิดว่าคืออะไร (ยังไม่ต้องฟันธง)

• 	คำถามที่อยากถามเพิ่มก่อนตัดสินใจ

• 	จะลบเลย, เก็บไว้ก่อน, หรือทำอย่างอื่นก่อน — ทำไม

• 	มีอะไรอีกที่ต้องเช็ค

• 	ใครควรรู้เรื่องนี้

## **เกณฑ์คะแนน (20 คะแนน)**

| มิติ | คะแนน | เกณฑ์คะแนนเต็ม |
| ----- | :---: | ----- |
| Structured thinking | 7 | มีลำดับ มี priority ไม่สะเปะสะปะ เริ่มจากง่าย/ปลอดภัยก่อน |
| Intellectual humility | 6 | ยอมรับข้อจำกัดของตัวเอง รู้ว่าต้องถามใคร ไม่แถ |
| Risk awareness | 5 | คิดถึงผลกระทบก่อนลงมือ ไม่ rush, ไม่ irreversible |
| Communication | 2 | อ่านเข้าใจ ตรงประเด็น ไม่ต้องหรูแต่ต้องชัด |

 

### **Bonus ที่เราประทับใจ (+1 คะแนน/ข้อ, สูงสุด \+5)**

• 	บอกตรง ๆ ว่า "ผมไม่เคยเจอแบบนี้ ถ้าเจอจริงผมจะ..." แทนการแถ

• 	มีคำถามกลับที่ควรถามก่อนลงมือ

• 	คิดถึง user/ลูกค้าที่ยังใช้ระบบ ไม่ใช่แค่มุม technical

• 	มีแผน B ถ้าแผนแรกใช้ไม่ได้

• 	แนบ AI Journal สั้น ๆ (prompt \+ AI ตอบ \+ ความเห็นของคุณ) 2-3 session

 

### **Tips**

• 	เขียนเหมือนคุยกับพี่ในทีม **ไม่ต้องเป็นทางการ**

• 	**400 คำตอบลึก ดีกว่า 800 คำผิวเผิน**

• 	ถ้าวาด flow/timeline ง่าย ๆ ได้ จะช่วยเล่าเยอะ **(ภาพจากมือถือก็ได้)**

• 	หัวข้อนี้**ไม่มีคำตอบถูกตายตัว เราดูวิธีคิด**

 

### **หมายเหตุสำหรับผู้ตรวจ**

**สัญญาณที่ควรระวัง** (ไม่ใช่หักอัตโนมัติ แต่ต้องอ่านดูให้ลึก):

• 	คำตอบที่มั่นใจว่า "แก้จบได้ใน 3 วัน" — ไม่ realistic กับ legacy 10 ปี

• 	"ลบไฟล์แปลกทิ้งเลย" โดยไม่มีเหตุผลประกอบ

• 	คำตอบที่ไม่มี priority — ทำทุกอย่างพร้อมกัน

• 	ทั้งคำตอบไม่มีคำถามกลับเลย — น่าจะไม่เข้าใจ scope

• 	เนื้อหาเป็น AI 100% (ขาดมุมมองส่วนตัว, ไม่มี adjustment)

 

**สัญญาณคนที่น่าสนใจ**

• 	ยอมรับไม่รู้ \+ มีแผนหาคำตอบ

• 	คิดเรื่อง rollback ก่อนเริ่มทำ

• 	เข้าใจว่าการลบทันที \= เสียหลักฐาน (ไม่ต้องใช้ศัพท์ IR ก็ได้)

• 	เห็นภาพใหญ่ — technical \+ คน \+ ลูกค้า

 

# 

# **วิธีส่งการบ้าน**

| Deadline ส่งภายใน 5 วัน (120 ชั่วโมง) นับจากเวลาที่ได้รับข้อสอบ |
| :---- |

 

## **สรุปคะแนนรวม**

| Part | เนื้อหา | คะแนน |
| :---: | ----- | :---: |
| Part 1 | Coding Task | 65 |
| Part 2 | Business Scenario Video | 35 |
| Part 3 | Leadership Reflection | 20 |
| Part 4 | Legacy System Thinking | 20 |
| Bonus | AI Journal (Part 1\) | \+10 |
| Quality | Green Flags | \+5 |
| รวม | 180 \+ 15 bonus | 195 |

 

## 

## **เกณฑ์ผ่าน**

| สถานะ | คะแนน | Action |
| ----- | :---: | ----- |
| Top Talent | ≥ 145 / 180 | เชิญสัมภาษณ์รอบสุดท้ายแน่นอน |
| ผ่าน | 110 \- 144 | เชิญสัมภาษณ์รอบสุดท้าย |
| พิจารณา | 90 \- 109 | review เพิ่มเติม |
| ไม่ผ่าน | \< 90 | ขอบคุณสำหรับการเข้าร่วม |

 

# **FAQ**

**Q: ทำไม่เสร็จทั้งหมดใน 5 วัน ทำยังไงดี?**

**A:** ทำ Part ที่คุณถนัดที่สุดให้ดีที่สุด ดีกว่าทำครบแต่ผิวเผินทุก Part

**Q: ใช้ template / boilerplate ได้ไหม?**

**A:** ได้ แต่ต้องระบุใน README ว่าใช้ template ไหน

**Q: Live interview รอบสุดท้ายจะถามอะไร?**

**A:** ถามเกี่ยวกับสิ่งที่คุณทำในการบ้านนี่แหละ \+ live bug fix \+ culture fit

**Q: ถ้าโดน AI ตอบให้เกือบหมดจะผิดไหม?**

**A:** ไม่ผิด แต่ต้อง "เข้าใจทุกบรรทัด" เพราะจะถาม deep questions ในรอบสุดท้าย

**Q: ต้อง deploy จริงไหม?**

**A:** ไม่บังคับ แต่ docker compose up ต้อง run ได้

**Q: Part 4 ต้องเคยทำ legacy system มาก่อนไหม?**

**A:** ไม่ต้อง — เราดูวิธีคิด ไม่ได้ดูว่ารู้ Windows/PHP/security หรือเปล่า ถ้าไม่เคยเจอให้เล่าว่าจะเริ่มทำความเข้าใจยังไง

 

| ขอให้สนุกกับการบ้านครับ\! เราไม่ได้มองหาคนเก่งที่สุด — แต่มองหาคนที่พร้อมเติบโตและสร้าง impact ในทีม |
| :---: |

   
