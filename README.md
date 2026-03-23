# VoiceNote Pro 🎤

Telegram Mini App для голосового структурирования заметок с AI.

## Что делает

1. Нажимаешь кнопку — говоришь идею
2. AI (Claude) автоматически структурирует: заголовок, категория, ключевые мысли, действия, теги
3. Всё хранится в умном блокноте по категориям
4. Поиск по всем заметкам

## Быстрый старт

### 1. Настройка

```bash
cp .env.example backend/.env
# Добавь свой ANTHROPIC_API_KEY в backend/.env
```

### 2. Установка зависимостей

```bash
npm run install:all
```

### 3. Запуск в dev режиме

```bash
npm run dev
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:3001

## Стек

| Слой | Технология |
|------|-----------|
| Frontend | React 18 + Vite + TypeScript |
| UI | Tailwind CSS v3 |
| State | Zustand |
| Backend | Hono.js + Node.js |
| Database | SQLite (better-sqlite3) |
| AI | Anthropic Claude Haiku |
| Voice | Web Speech API |
| Deploy | Docker + nginx |

## Категории заметок

📝 Общее · 💼 Работа · 💡 Идеи · 📚 Обучение
🏃 Здоровье · 💰 Финансы · ✈️ Путешествия · 🥃 Вкус и стиль

## Deploy (Docker)

```bash
docker-compose up -d
```

## Структура проекта

```
voicenote-pro/
├── backend/          # Hono.js API
│   ├── src/
│   │   ├── db/       # SQLite + схема
│   │   ├── routes/   # notes, categories
│   │   └── services/ # AI (Claude)
│   └── data/         # notes.db (создаётся автоматически)
└── frontend/         # React Vite TMA
    └── src/
        ├── components/ui/  # MicButton, NoteCard, BottomNav...
        ├── pages/          # Record, Notes, Categories, Search
        ├── hooks/          # useVoiceRecorder
        ├── store/          # Zustand
        └── api/            # HTTP client
```
