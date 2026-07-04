# Part 1 — Feature Checklist & คะแนน

## Required (30 คะแนน — ต้องครบ)

| # | Feature | คะแนน | Done | เกณฑ์เต็ม |
|---|---------|------:|:----:|-----------|
| 1 | Login + Protected Routes | 5 | [x] | bcrypt + session mgmt |
| 2 | Upload PDF/TXT | 5 | [x] | validate type/size + sanitize path |
| 3 | Chat AI basic | 5 | [x] | error handling + timeout |
| 4 | Chat + File Context | 10 | [x] | แม่นยำพอใช้ + handle ไฟล์ใหญ่ |
| 5 | Token Usage Counter | 5 | [x] | per message + session total |

## Bonus (cap 20 — เลือกทำ)

| # | Feature | คะแนน | Done | Priority 2 วัน |
|---|---------|------:|:----:|----------------|
| A | Markdown rendering | 3 | [x] | สูง |
| B | Citation จากเอกสาร | 5 | [x] | กลาง |
| C | Streaming response | 3 | [x] | สูง |
| D | RAG + Vector DB | 8 | [ ] | ต่ำ (ใช้เวลามาก) |
| E | Conversation history | 3 | [x] | กลาง |
| F | Rate limiting | 3 | [x] | ต่ำ |
| G | Docker + Healthcheck | 3 | [x] | สูง (ทำตั้งแต่แรก) |
| H | Unit tests ≥40% | 5 | [ ] | ต่ำ |

> รวม bonus ที่ทำแล้ว 20/20 (แตะ cap พอดี) — D และ H ยังไม่ทำ ถ้าจะเพิ่มคะแนนต้องไปแทนที่ตัวใดตัวหนึ่งที่ทำแล้ว หรือยอมรับว่าเกิน cap ไม่ได้คะแนนเพิ่ม

## Code Quality (15 คะแนน)

| มิติ | คะแนน | Done |
|------|------:|:----:|
| Structure & Clean Code | 5 | [ ] |
| Security Hardening | 5 | [ ] |
| Git Commit History | 5 | [ ] |

## Deliverables

| ไฟล์ | Done |
|------|:----:|
| README.md | [x] |
| AI_JOURNAL.md (15+ sessions) | [ ] (ตอนนี้ 8) |
| DECISIONS.md (3 decisions) | [x] |
| docker compose up รันได้ | [x] |
