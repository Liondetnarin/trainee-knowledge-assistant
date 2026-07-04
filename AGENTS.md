# AGENTS.md — แผนที่โปรเจกต

## โปรเจกตนี้คืออะไร
ข้อสอบ **Junior Dev Assessment — Mini Knowledge Assistant**  
4 Parts + Bonus | เป้าผ่าน **≥110/180** | Timeline **2 วัน**

## โครงสร้าง Monorepo

```
trainee-knowledge-assistant/
├── .cursor/
│   ├── rules/          ← กฎห้ามละเมิด (always apply)
│   └── skills/         ← workflow แต่ละ Part (@part-1-webapp ฯลฯ)
├── webapp/             ← Part 1: Next.js 14 App Router
├── docs/               ← Part 2–4 deliverables + assignment-spec.md
├── docker-compose.yml  ← รัน Part 1
├── README.md           ← ส่ง Part 1 (repo name: trainee-knowledge-assistant)
├── AI_JOURNAL.md
├── DECISIONS.md
└── TASK.md             ← checklist งาน
```

## Stack Part 1 (ที่เลือกแล้ว)
- **Next.js 14** + TypeScript + Tailwind
- **SQLite** + Drizzle ORM
- **iron-session** + bcrypt
- **Simple text chunking** (ไม่ใช้ Vector DB ใน Phase 1)
- **AI:** OpenAI หรือ Claude ผ่าน env

## ลำดับงานแนะนำ
1. Part 1 Required Features ครบ → docker รันได้
2. README + AI_JOURNAL + DECISIONS
3. Part 4 → Part 3 → Part 2 Video
4. Part 1 Bonus (ถ้ามีเวลา)

## เรียกใช้ Skills
- Part 1 coding: skill `part-1-webapp`
- Part 2 video: skill `part-2-video`
- Part 3 leadership: skill `part-3-leadership`
- Part 4 legacy: skill `part-4-legacy`

## กฎสำคัญ
- อ่าน `.cursor/rules/00-assignment-core.mdc` — ห้ามให้คนอื่นทำแทน, ต้องเข้าใจทุกบรรทัด code
- เอกสารต้นฉบับ: `docs/assignment-spec.md`
