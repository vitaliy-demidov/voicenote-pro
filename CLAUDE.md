# CLAUDE.md — VoiceNote Pro

## 1. ПРОЕКТ

- **Название**: VoiceNote Pro
- **Стек**: React 18 + NestJS-like backend + Anthropic Claude API
- **Суть**: AI Voice Notes — запись голоса → транскрипция → AI-обработанные заметки
- **Порт**: 3000 (backend), 5173 (frontend)
- **Deploy**: Docker
- **Ключевые модули**: Recording, Transcription, AI Summary (Claude API), Notes management

---

## 2. АРХИТЕКТУРА

```
voicenote-pro/
├── frontend/         ← React 18
├── backend/          ← NestJS-like API + Claude integration
├── Dockerfile
├── docker-compose.yml
└── package.json      ← Monorepo scripts
```

### Data Flow
User Voice → MediaRecorder API → Backend API → Whisper/Transcription → Claude API → Structured Notes

---

## 3. KNOWN TECH DEBT (Score 6.0)

| # | Проблема | Серьёзность |
|---|---------|-------------|
| 1 | 0 ESLint config | HIGH |
| 2 | 0 Sentry | HIGH |
| 3 | 16 console.log | MEDIUM |
| 4 | 0 CI workflows | HIGH |
| 5 | 10 `any` типов | MEDIUM |

---

## 4. КОНТЕКСТ-МЕНЕДЖМЕНТ

- `ARCHITECTURE.md` — архитектура
- `ЗАПУСК.md` — инструкции по запуску
- strict: true для обоих пакетов
- 3 Docker файла, .env.example есть
