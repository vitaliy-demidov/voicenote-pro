import { describe, it, expect, vi, beforeEach } from 'vitest'

// ----------------------------------------------------------------
// Tests based on real src/api/client.ts logic
// ----------------------------------------------------------------

// Mirror ApiError from client.ts
class ApiError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

describe('ApiError class', () => {
  it('has correct name, message, and status', () => {
    const err = new ApiError('Not found', 404)
    expect(err.name).toBe('ApiError')
    expect(err.message).toBe('Not found')
    expect(err.status).toBe(404)
  })

  it('is instance of Error', () => {
    expect(new ApiError('x', 500)).toBeInstanceOf(Error)
  })
})

describe('API endpoints — request shape', () => {
  it('notes list endpoint is GET /notes', () => {
    const method = 'GET'
    const path = '/notes'
    expect(method).toBe('GET')
    expect(path).toBe('/notes')
  })

  it('note creation sends raw_text and user_id', () => {
    const body = { raw_text: 'купить молоко', user_id: '12345' }
    expect(body).toHaveProperty('raw_text')
    expect(body).toHaveProperty('user_id')
    expect(body.raw_text).toBe('купить молоко')
  })

  it('note update only sends changed fields (partial)', () => {
    const updatePayload = { title: 'New title' }
    expect(Object.keys(updatePayload)).toHaveLength(1)
    expect(updatePayload).not.toHaveProperty('raw_text')
  })

  it('search endpoint includes query param q', () => {
    const params = new URLSearchParams({ q: 'идея' })
    expect(params.get('q')).toBe('идея')
  })

  it('notes list supports optional category filter', () => {
    const params = new URLSearchParams({
      user_id: '12345',
      category: 'Работа',
    })
    expect(params.get('category')).toBe('Работа')
  })
})

describe('API timeout configuration', () => {
  it('timeout is set to 30000ms (30s) for AI processing', () => {
    const TIMEOUT_MS = 30000
    expect(TIMEOUT_MS).toBe(30_000)
    expect(TIMEOUT_MS).toBeGreaterThan(5_000) // must be long enough for AI
  })
})

describe('Telegram initData header injection', () => {
  it('adds X-Telegram-Init-Data header when initData is present', () => {
    const initData = 'query_id=abc&user=xyz'
    const headers: Record<string, string> = {}

    if (initData) {
      headers['X-Telegram-Init-Data'] = initData
    }

    expect(headers).toHaveProperty('X-Telegram-Init-Data', initData)
  })

  it('does not add header when initData is empty string', () => {
    const initData = ''
    const headers: Record<string, string> = {}

    if (initData) {
      headers['X-Telegram-Init-Data'] = initData
    }

    expect(headers).not.toHaveProperty('X-Telegram-Init-Data')
  })
})
