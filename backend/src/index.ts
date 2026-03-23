import 'dotenv/config'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { serve } from '@hono/node-server'
import { createHmac } from 'crypto'
import notesRoutes from './routes/notes.js'
import categoriesRoutes from './routes/categories.js'

// =========================================
// STARTUP CHECKS
// =========================================

if (!process.env.ANTHROPIC_API_KEY) {
  console.error('❌ ANTHROPIC_API_KEY is not set! Set it in backend/.env')
  process.exit(1)
}

// =========================================
// RATE LIMITER (in-memory)
// =========================================

const rateLimitMap = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT = 30          // requests per window
const RATE_WINDOW_MS = 60_000  // 1 minute

function getRealIP(req: Request): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    req.headers.get('x-real-ip') ||
    'unknown'
  )
}

function rateLimit(ip: string): { ok: boolean; remaining: number; resetAt: number } {
  const now = Date.now()
  const record = rateLimitMap.get(ip)

  if (!record || now > record.resetAt) {
    const resetAt = now + RATE_WINDOW_MS
    rateLimitMap.set(ip, { count: 1, resetAt })
    return { ok: true, remaining: RATE_LIMIT - 1, resetAt }
  }

  record.count++
  const remaining = Math.max(0, RATE_LIMIT - record.count)
  return { ok: record.count <= RATE_LIMIT, remaining, resetAt: record.resetAt }
}

// Clean up stale rate limit entries every 5 min
setInterval(() => {
  const now = Date.now()
  for (const [ip, record] of rateLimitMap.entries()) {
    if (now > record.resetAt) rateLimitMap.delete(ip)
  }
}, 5 * 60_000)

// =========================================
// TELEGRAM INIT DATA VERIFICATION
// =========================================

/** Verify Telegram WebApp initData signature */
function verifyTelegramAuth(initData: string, botToken: string): boolean {
  try {
    const params = new URLSearchParams(initData)
    const hash = params.get('hash')
    if (!hash) return false

    // Build data-check-string (sorted key=value pairs, excluding hash)
    params.delete('hash')
    const dataCheckString = [...params.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}=${v}`)
      .join('\n')

    // HMAC-SHA256: secret = HMAC-SHA256("WebAppData", botToken)
    const secret = createHmac('sha256', 'WebAppData').update(botToken).digest()
    const expectedHash = createHmac('sha256', secret).update(dataCheckString).digest('hex')

    return expectedHash === hash
  } catch {
    return false
  }
}

// =========================================
// APP SETUP
// =========================================

const app = new Hono()

// Logger
app.use('*', logger())

// CORS — restrict to known origins only (NO wildcard!)
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:4173',
  'http://localhost:3000',
  'https://web.telegram.org',
  process.env.FRONTEND_URL || '',
].filter(Boolean)

app.use(
  '*',
  cors({
    origin: (origin) => {
      if (!origin) return allowedOrigins[0]
      if (
        allowedOrigins.some(o => origin === o) ||
        origin.endsWith('.telegram.org') ||
        origin.endsWith('.twa.app')
      ) {
        return origin
      }
      return null // reject other origins
    },
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization', 'X-Telegram-Init-Data'],
  })
)

// =========================================
// MIDDLEWARE: Rate Limiting
// =========================================

app.use('/api/notes', async (c, next) => {
  if (c.req.method === 'POST') {
    const ip = getRealIP(c.req.raw)
    const result = rateLimit(ip)

    c.header('X-RateLimit-Limit', String(RATE_LIMIT))
    c.header('X-RateLimit-Remaining', String(result.remaining))
    c.header('X-RateLimit-Reset', String(Math.ceil(result.resetAt / 1000)))

    if (!result.ok) {
      return c.json(
        {
          error: 'Слишком много запросов. Попробуй через минуту.',
          retryAfter: Math.ceil((result.resetAt - Date.now()) / 1000),
        },
        429
      )
    }
  }
  await next()
})

// =========================================
// MIDDLEWARE: Optional Telegram Auth
// =========================================

app.use('/api/*', async (c, next) => {
  const botToken = process.env.TELEGRAM_BOT_TOKEN
  const initData = c.req.header('X-Telegram-Init-Data')

  // If bot token is configured and init data provided — verify it
  if (botToken && initData) {
    const isValid = verifyTelegramAuth(initData, botToken)
    if (!isValid) {
      return c.json({ error: 'Invalid Telegram authentication' }, 401)
    }
    // Auth verified — continue to route handler
  }

  await next()
})

// =========================================
// HEALTH CHECK
// =========================================

app.get('/health', (c) =>
  c.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    anthropic: !!process.env.ANTHROPIC_API_KEY,
    telegram: !!process.env.TELEGRAM_BOT_TOKEN,
    rateLimit: `${RATE_LIMIT} req/min per IP`,
  })
)

// =========================================
// ROUTES
// =========================================

app.route('/api/notes', notesRoutes)
app.route('/api/categories', categoriesRoutes)

// =========================================
// ERROR HANDLERS
// =========================================

app.notFound((c) => c.json({ error: 'Not found' }, 404))

app.onError((err, c) => {
  console.error('[Server Error]:', err.message)
  // Don't expose internal error details in production
  const isProduction = process.env.NODE_ENV === 'production'
  return c.json(
    {
      error: isProduction ? 'Internal server error' : err.message,
    },
    500
  )
})

// =========================================
// START
// =========================================

const PORT = Number(process.env.PORT || 3001)

serve({ fetch: app.fetch, port: PORT }, () => {
  console.log(`
╔══════════════════════════════════════════╗
║      🎤 VOICENOTE PRO BACKEND v2.0      ║
╠══════════════════════════════════════════╣
║  URL:       http://localhost:${PORT}         ║
║  Claude:    ${process.env.ANTHROPIC_API_KEY ? '✅ Подключён' : '❌ Нет API ключа  '}        ║
║  Telegram:  ${process.env.TELEGRAM_BOT_TOKEN ? '✅ Подключён' : '⚠️  Без верификации'}       ║
║  Rate:      ${RATE_LIMIT} req/min per IP          ║
╚══════════════════════════════════════════╝
  `)
})
