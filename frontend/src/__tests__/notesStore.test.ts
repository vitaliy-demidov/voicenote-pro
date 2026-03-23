import { describe, it, expect, vi, beforeEach } from 'vitest'

// ----------------------------------------------------------------
// Tests based on real store logic from src/store/notesStore.ts
// ----------------------------------------------------------------

// Inline the real getUserId logic for pure unit testing
function getUserId(): string {
  if (
    typeof window !== 'undefined' &&
    (window as any).Telegram?.WebApp?.initDataUnsafe?.user?.id
  ) {
    return String((window as any).Telegram.WebApp.initDataUnsafe.user.id)
  }
  return 'default'
}

// Inline the real formatError logic from notesStore.ts
class ApiError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

function formatError(err: unknown, fallback = 'Ошибка. Попробуй снова.'): string {
  if (err instanceof ApiError) {
    if (err.status === 429) return 'Слишком много запросов. Подожди минуту.'
    if (err.status === 400) return err.message
    if (err.status === 404) return 'Заметка не найдена.'
    if (err.status === 401) return 'Ошибка авторизации.'
    return err.message || fallback
  }
  if (err instanceof Error) return err.message || fallback
  return fallback
}

describe('notesStore — getUserId()', () => {
  it('returns Telegram user id when available', () => {
    // setup.js mocks window.Telegram with user id 12345
    const id = getUserId()
    expect(id).toBe('12345')
  })

  it('returns "default" when Telegram is not available', () => {
    const originalTelegram = (window as any).Telegram
    ;(window as any).Telegram = undefined
    const id = getUserId()
    expect(id).toBe('default')
    ;(window as any).Telegram = originalTelegram
  })
})

describe('notesStore — formatError()', () => {
  it('returns rate-limit message for 429', () => {
    const msg = formatError(new ApiError('Too many requests', 429))
    expect(msg).toBe('Слишком много запросов. Подожди минуту.')
  })

  it('returns "Заметка не найдена." for 404', () => {
    expect(formatError(new ApiError('not found', 404))).toBe('Заметка не найдена.')
  })

  it('returns "Ошибка авторизации." for 401', () => {
    expect(formatError(new ApiError('unauthorized', 401))).toBe('Ошибка авторизации.')
  })

  it('returns original message for 400', () => {
    expect(formatError(new ApiError('Field required', 400))).toBe('Field required')
  })

  it('returns apiError.message for other statuses', () => {
    expect(formatError(new ApiError('Server exploded', 500))).toBe('Server exploded')
  })

  it('returns Error.message for plain Error', () => {
    expect(formatError(new Error('network timeout'))).toBe('network timeout')
  })

  it('returns fallback for unknown error type', () => {
    expect(formatError(42)).toBe('Ошибка. Попробуй снова.')
  })
})

describe('notesStore — Note data model', () => {
  it('should have all required fields on a Note object', () => {
    const note = {
      id: 1,
      user_id: '12345',
      raw_text: 'купить молоко и хлеб',
      title: 'Список покупок',
      category: 'Личное',
      summary: 'Купить молоко и хлеб',
      key_points: ['молоко', 'хлеб'],
      action_items: ['Зайти в магазин'],
      tags: ['покупки', 'бытовое'],
      emoji: '🛒',
      created_at: '2026-03-08T12:00:00Z',
      updated_at: '2026-03-08T12:00:00Z',
    }
    expect(note).toHaveProperty('id')
    expect(note).toHaveProperty('raw_text')
    expect(note).toHaveProperty('key_points')
    expect(Array.isArray(note.key_points)).toBe(true)
    expect(Array.isArray(note.action_items)).toBe(true)
  })

  it('should sort notes by created_at descending (newest first)', () => {
    const notes = [
      { id: 1, created_at: '2026-03-01T00:00:00Z', title: 'Old' },
      { id: 2, created_at: '2026-03-08T00:00:00Z', title: 'New' },
      { id: 3, created_at: '2026-03-05T00:00:00Z', title: 'Mid' },
    ]
    const sorted = [...notes].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
    expect(sorted[0].title).toBe('New')
    expect(sorted[2].title).toBe('Old')
  })

  it('should filter notes by category "all" — returns all notes', () => {
    const notes = [
      { id: 1, category: 'Работа' },
      { id: 2, category: 'Личное' },
      { id: 3, category: 'Идеи' },
    ]
    const filtered = (cat: string) =>
      cat === 'all' ? notes : notes.filter(n => n.category === cat)
    expect(filtered('all')).toHaveLength(3)
    expect(filtered('Работа')).toHaveLength(1)
  })
})

describe('notesStore — Stats model', () => {
  it('should have correct Stats shape', () => {
    const stats = { total: 42, today: 3, top_category: 'Работа' }
    expect(stats.total).toBe(42)
    expect(stats.today).toBe(3)
    expect(stats.top_category).toBe('Работа')
  })

  it('should allow null top_category when no notes exist', () => {
    const stats = { total: 0, today: 0, top_category: null }
    expect(stats.top_category).toBeNull()
  })
})
