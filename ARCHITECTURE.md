# VoiceNote Pro: Architecture

## Overview
AI-powered голосовые заметки с транскрибацией через Anthropic Claude API. Monorepo: React фронтенд + Node.js/Express бэкенд.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite |
| Backend | Node.js + Express |
| AI | Anthropic Claude API (транскрибация) |
| Audio | Web Audio API + MediaRecorder |

## Architecture

```
┌───────────────────────────────────────┐
│     React Frontend (port 5174)        │
│                                       │
│  ┌─────────────┐  ┌────────────────┐  │
│  │  Recorder   │  │  Notes List    │  │
│  │  Component  │  │  + Search      │  │
│  └──────┬──────┘  └───────▲────────┘  │
└─────────┼─────────────────┼───────────┘
          │ Audio Blob       │ Notes JSON
┌─────────▼─────────────────┼───────────┐
│     Node.js Backend (port 3002)       │
│                                       │
│  POST /api/transcribe  ─────────────► │──► Claude API
│  GET  /api/notes                      │
│  POST /api/notes                      │
│  DELETE /api/notes/:id                │
└───────────────────────────────────────┘
```

## Data Flow
1. User → Record audio → MediaRecorder → Blob
2. POST /api/transcribe → Claude API → transcript
3. Save → GET /api/notes → display list
4. Search/filter notes client-side

## Environment: `ANTHROPIC_API_KEY` required
## Running: `npm run dev` (concurrently frontend + backend)
