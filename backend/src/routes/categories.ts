import { Hono } from 'hono'
import { db } from '../db/database.js'

const categories = new Hono()

// GET /api/categories — list categories with note counts
categories.get('/', (c) => {
  const userId = c.req.query('user_id') || 'default'

  const rows = db.prepare(`
    SELECT
      c.id,
      c.name,
      c.emoji,
      c.color,
      COUNT(n.id) as count
    FROM categories c
    LEFT JOIN notes n ON n.category = c.name AND n.user_id = c.user_id
    WHERE c.user_id = ?
    GROUP BY c.id
    ORDER BY count DESC, c.name ASC
  `).all(userId)

  return c.json(rows)
})

// GET /api/categories/stats — overall stats
categories.get('/stats', (c) => {
  const userId = c.req.query('user_id') || 'default'

  const total = (db.prepare(`SELECT COUNT(*) as count FROM notes WHERE user_id = ?`).get(userId) as { count: number }).count
  const today = (db.prepare(`
    SELECT COUNT(*) as count FROM notes
    WHERE user_id = ? AND date(created_at) = date('now')
  `).get(userId) as { count: number }).count

  const topCategory = db.prepare(`
    SELECT category, COUNT(*) as count
    FROM notes WHERE user_id = ?
    GROUP BY category ORDER BY count DESC LIMIT 1
  `).get(userId) as { category: string; count: number } | undefined

  return c.json({ total, today, top_category: topCategory?.category || null })
})

export default categories
