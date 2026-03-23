import Database from 'better-sqlite3'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const dataDir = path.join(__dirname, '../../data')
const DB_PATH = path.join(dataDir, 'notes.db')

// Ensure data directory exists
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true })

export const db = new Database(DB_PATH)

// Performance settings
db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')
db.pragma('synchronous = NORMAL')
db.pragma('cache_size = 10000')
db.pragma('temp_store = MEMORY')

// =========================================
// SCHEMA
// =========================================

db.exec(`
  CREATE TABLE IF NOT EXISTS notes (
    id           INTEGER  PRIMARY KEY AUTOINCREMENT,
    user_id      TEXT     NOT NULL DEFAULT 'default',
    raw_text     TEXT     NOT NULL,
    title        TEXT     NOT NULL DEFAULT 'Заметка',
    category     TEXT     NOT NULL DEFAULT 'Общее',
    summary      TEXT     NOT NULL DEFAULT '',
    key_points   TEXT     NOT NULL DEFAULT '[]',
    action_items TEXT     NOT NULL DEFAULT '[]',
    tags         TEXT     NOT NULL DEFAULT '[]',
    emoji        TEXT     NOT NULL DEFAULT '📝',
    created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE INDEX IF NOT EXISTS idx_notes_user     ON notes(user_id);
  CREATE INDEX IF NOT EXISTS idx_notes_category ON notes(user_id, category);
  CREATE INDEX IF NOT EXISTS idx_notes_created  ON notes(created_at DESC);

  CREATE TABLE IF NOT EXISTS categories (
    id       INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id  TEXT    NOT NULL DEFAULT 'default',
    name     TEXT    NOT NULL,
    emoji    TEXT    NOT NULL DEFAULT '📁',
    color    TEXT    NOT NULL DEFAULT '#6366f1',
    UNIQUE(user_id, name)
  );

  CREATE INDEX IF NOT EXISTS idx_categories_user ON categories(user_id);
`)

// =========================================
// DEFAULT CATEGORIES TEMPLATE
// =========================================

const DEFAULT_CATEGORIES = [
  { name: 'Общее',          emoji: '📝', color: '#6366f1' },
  { name: 'Работа',         emoji: '💼', color: '#3b82f6' },
  { name: 'Идеи',           emoji: '💡', color: '#f59e0b' },
  { name: 'Обучение',       emoji: '📚', color: '#10b981' },
  { name: 'Здоровье',       emoji: '🏃', color: '#ef4444' },
  { name: 'Финансы',        emoji: '💰', color: '#84cc16' },
  { name: 'Путешествия',    emoji: '✈️', color: '#06b6d4' },
  { name: 'Вкус и стиль',   emoji: '🥃', color: '#8b5cf6' },
]

// Seed default user categories
const insertCategory = db.prepare(`
  INSERT OR IGNORE INTO categories (user_id, name, emoji, color)
  VALUES (?, ?, ?, ?)
`)

const seedDefaults = db.transaction((userId: string) => {
  for (const cat of DEFAULT_CATEGORIES) {
    insertCategory.run(userId, cat.name, cat.emoji, cat.color)
  }
})

seedDefaults('default')

// =========================================
// HELPERS
// =========================================

/**
 * Ensure a user has their own set of categories (copied from defaults).
 * Call this when a new user creates their first note.
 */
export function ensureUserCategories(userId: string): void {
  if (userId === 'default') return

  const existing = db.prepare(
    `SELECT COUNT(*) as count FROM categories WHERE user_id = ?`
  ).get(userId) as { count: number }

  if (existing.count === 0) {
    seedDefaults(userId)
  }
}

// =========================================
// TYPES
// =========================================

export type Note = {
  id: number
  user_id: string
  raw_text: string
  title: string
  category: string
  summary: string
  key_points: string[]
  action_items: string[]
  tags: string[]
  emoji: string
  created_at: string
  updated_at: string
}

export type NoteRow = Omit<Note, 'key_points' | 'action_items' | 'tags'> & {
  key_points: string
  action_items: string
  tags: string
}

export function parseNote(row: NoteRow): Note {
  let key_points: string[] = []
  let action_items: string[] = []
  let tags: string[] = []

  try { key_points = JSON.parse(row.key_points || '[]') } catch { key_points = [] }
  try { action_items = JSON.parse(row.action_items || '[]') } catch { action_items = [] }
  try { tags = JSON.parse(row.tags || '[]') } catch { tags = [] }

  return { ...row, key_points, action_items, tags }
}
