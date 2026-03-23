import { Hono } from 'hono'
import { db, parseNote, ensureUserCategories, type NoteRow } from '../db/database.js'
import { structureNote, sanitizeInput } from '../services/ai.js'

const notes = new Hono()

// =========================================
// HELPERS
// =========================================

const MAX_TEXT_LENGTH = 5000
const MAX_LIMIT = 100

function validateUserId(userId: string): boolean {
  return /^[\w-]{1,64}$/.test(userId)
}

function getUserId(c: { req: { query: (k: string) => string | undefined } }): string | null {
  const uid = c.req.query('user_id') || 'default'
  return validateUserId(uid) ? uid : null
}

function getUserIdFromBody(userId?: string): string {
  const uid = userId || 'default'
  return validateUserId(uid) ? uid : 'default'
}

// =========================================
// GET /api/notes — list notes
// =========================================

notes.get('/', (c) => {
  const userId = getUserId(c)
  if (!userId) return c.json({ error: 'Invalid user_id' }, 400)

  const category = c.req.query('category')
  const limit = Math.min(Number(c.req.query('limit') || 50), MAX_LIMIT)
  const offset = Math.max(Number(c.req.query('offset') || 0), 0)

  let query = `SELECT * FROM notes WHERE user_id = ?`
  const params: (string | number)[] = [userId]

  if (category && category !== 'all') {
    query += ` AND category = ?`
    params.push(category)
  }

  query += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`
  params.push(limit, offset)

  try {
    const rows = db.prepare(query).all(...params) as NoteRow[]
    return c.json(rows.map(parseNote))
  } catch (err) {
    console.error('[notes GET /]', err)
    return c.json({ error: 'Ошибка загрузки заметок' }, 500)
  }
})

// =========================================
// GET /api/notes/search — search
// =========================================

notes.get('/search', (c) => {
  const userId = getUserId(c)
  if (!userId) return c.json({ error: 'Invalid user_id' }, 400)

  const q = c.req.query('q') || ''
  const limit = Math.min(Number(c.req.query('limit') || 30), MAX_LIMIT)
  const offset = Math.max(Number(c.req.query('offset') || 0), 0)

  if (!q.trim()) return c.json([])

  // Sanitize search query
  const safeQ = q.slice(0, 200).replace(/[%_]/g, '\\$&')

  try {
    const rows = db.prepare(`
      SELECT * FROM notes
      WHERE user_id = ?
        AND (
          title LIKE ? OR summary LIKE ? OR raw_text LIKE ?
          OR tags LIKE ? OR key_points LIKE ?
        )
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `).all(
      userId,
      `%${safeQ}%`, `%${safeQ}%`, `%${safeQ}%`, `%${safeQ}%`, `%${safeQ}%`,
      limit, offset
    ) as NoteRow[]

    return c.json(rows.map(parseNote))
  } catch (err) {
    console.error('[notes GET /search]', err)
    return c.json({ error: 'Ошибка поиска' }, 500)
  }
})

// =========================================
// GET /api/notes/:id — single note
// =========================================

notes.get('/:id', (c) => {
  const id = c.req.param('id')
  const userId = getUserId(c)
  if (!userId) return c.json({ error: 'Invalid user_id' }, 400)

  if (!/^\d+$/.test(id)) return c.json({ error: 'Invalid note id' }, 400)

  try {
    const row = db.prepare(
      `SELECT * FROM notes WHERE id = ? AND user_id = ?`
    ).get(Number(id), userId) as NoteRow | undefined

    if (!row) return c.json({ error: 'Not found' }, 404)
    return c.json(parseNote(row))
  } catch (err) {
    console.error('[notes GET /:id]', err)
    return c.json({ error: 'Ошибка загрузки заметки' }, 500)
  }
})

// =========================================
// POST /api/notes — create note
// =========================================

notes.post('/', async (c) => {
  let body: { raw_text?: string; user_id?: string }

  try {
    body = await c.req.json()
  } catch {
    return c.json({ error: 'Invalid JSON body' }, 400)
  }

  if (!body.raw_text?.trim()) {
    return c.json({ error: 'raw_text is required' }, 400)
  }

  if (body.raw_text.length > MAX_TEXT_LENGTH) {
    return c.json(
      { error: `Текст слишком длинный. Максимум ${MAX_TEXT_LENGTH} символов.` },
      400
    )
  }

  const userId = getUserIdFromBody(body.user_id)
  const rawText = sanitizeInput(body.raw_text)

  try {
    // Ensure user has their own categories
    ensureUserCategories(userId)

    // AI structuring
    const structured = await structureNote(rawText)

    const result = db.prepare(`
      INSERT INTO notes (user_id, raw_text, title, category, summary, key_points, action_items, tags, emoji)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      userId,
      rawText,
      structured.title,
      structured.category,
      structured.summary,
      JSON.stringify(structured.key_points),
      JSON.stringify(structured.action_items),
      JSON.stringify(structured.tags),
      structured.emoji,
    )

    const newNote = db.prepare(`SELECT * FROM notes WHERE id = ?`).get(result.lastInsertRowid) as NoteRow
    return c.json(parseNote(newNote), 201)
  } catch (err) {
    console.error('[notes POST /]', err)
    return c.json({ error: 'Ошибка создания заметки. Попробуй ещё раз.' }, 500)
  }
})

// =========================================
// PUT /api/notes/:id — update note
// =========================================

notes.put('/:id', async (c) => {
  const id = c.req.param('id')
  if (!/^\d+$/.test(id)) return c.json({ error: 'Invalid note id' }, 400)

  let body: { user_id?: string; title?: string; summary?: string; category?: string; tags?: string[] }

  try {
    body = await c.req.json()
  } catch {
    return c.json({ error: 'Invalid JSON body' }, 400)
  }

  const userId = getUserIdFromBody(body.user_id)

  // Check ownership
  const existing = db.prepare(`SELECT id FROM notes WHERE id = ? AND user_id = ?`).get(Number(id), userId)
  if (!existing) return c.json({ error: 'Not found' }, 404)

  const updates: string[] = []
  const params: (string | number)[] = []

  if (body.title !== undefined) {
    updates.push('title = ?')
    params.push(body.title.slice(0, 200).trim() || 'Заметка')
  }
  if (body.summary !== undefined) {
    updates.push('summary = ?')
    params.push(body.summary.slice(0, 1000).trim())
  }
  if (body.category !== undefined) {
    updates.push('category = ?')
    params.push(body.category.slice(0, 100).trim())
  }
  if (body.tags !== undefined && Array.isArray(body.tags)) {
    updates.push('tags = ?')
    params.push(JSON.stringify(body.tags.slice(0, 20).map(t => String(t).slice(0, 50))))
  }

  if (updates.length === 0) {
    return c.json({ error: 'No fields to update' }, 400)
  }

  updates.push('updated_at = CURRENT_TIMESTAMP')
  params.push(Number(id), userId)

  try {
    db.prepare(
      `UPDATE notes SET ${updates.join(', ')} WHERE id = ? AND user_id = ?`
    ).run(...params)

    const updated = db.prepare(`SELECT * FROM notes WHERE id = ?`).get(Number(id)) as NoteRow
    return c.json(parseNote(updated))
  } catch (err) {
    console.error('[notes PUT /:id]', err)
    return c.json({ error: 'Ошибка обновления заметки' }, 500)
  }
})

// =========================================
// DELETE /api/notes/:id — delete note
// =========================================

notes.delete('/:id', (c) => {
  const id = c.req.param('id')
  if (!/^\d+$/.test(id)) return c.json({ error: 'Invalid note id' }, 400)

  const userId = c.req.query('user_id') || 'default'
  if (!validateUserId(userId)) return c.json({ error: 'Invalid user_id' }, 400)

  try {
    const result = db.prepare(
      `DELETE FROM notes WHERE id = ? AND user_id = ?`
    ).run(Number(id), userId)

    if (result.changes === 0) return c.json({ error: 'Not found' }, 404)
    return c.json({ success: true })
  } catch (err) {
    console.error('[notes DELETE /:id]', err)
    return c.json({ error: 'Ошибка удаления заметки' }, 500)
  }
})

export default notes
