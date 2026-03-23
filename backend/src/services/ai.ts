import Anthropic from '@anthropic-ai/sdk'

// =========================================
// CLIENT SETUP
// =========================================

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

const MODEL = process.env.CLAUDE_MODEL || 'claude-haiku-4-5'
const MAX_INPUT_LENGTH = 5000  // chars
const MAX_TOKENS = 1024

// =========================================
// TYPES
// =========================================

export type StructuredNote = {
  title: string
  category: string
  emoji: string
  summary: string
  key_points: string[]
  action_items: string[]
  tags: string[]
}

// =========================================
// HELPERS
// =========================================

/** Safe JSON parse with typed fallback */
function safeParseJSON<T>(text: string, fallback: T, context = ''): T {
  try {
    // Strip markdown code fences
    const stripped = text
      .replace(/```(?:json)?\s*/gi, '')
      .replace(/```/g, '')
      .trim()

    // Extract JSON object
    const match = stripped.match(/\{[\s\S]*\}/)
    if (!match) throw new Error('No JSON object found')

    return JSON.parse(match[0]) as T
  } catch (err) {
    console.error(`[AI] safeParseJSON failed${context ? ` (${context})` : ''}:`, err)
    return fallback
  }
}

/** Sanitize user input before sending to Claude */
export function sanitizeInput(input: string): string {
  return input
    .slice(0, MAX_INPUT_LENGTH)
    .replace(/```/g, '')
    .replace(/\bSYSTEM:/gi, '')
    .replace(/\bASSISTANT:/gi, '')
    .replace(/\bUSER:/gi, '')
    .trim()
}

// =========================================
// FALLBACKS
// =========================================

const FALLBACK_NOTE: StructuredNote = {
  title: 'Новая заметка',
  category: 'Общее',
  emoji: '📝',
  summary: 'Не удалось структурировать заметку автоматически.',
  key_points: [],
  action_items: [],
  tags: [],
}

// =========================================
// SYSTEM PROMPT
// =========================================

const SYSTEM_PROMPT = `Ты — умный ассистент для структурирования заметок.
Пользователь записывает идеи голосом — твоя задача превратить сырой текст в чёткую структуру.

КАТЕГОРИИ (выбери одну наиболее подходящую):
- Общее, Работа, Идеи, Обучение, Здоровье, Финансы, Путешествия, Вкус и стиль

ПРАВИЛА:
1. Заголовок — короткий (3-6 слов), ёмкий, на русском
2. Категорию определяй по смыслу текста
3. Emoji — 1 символ, отражающий суть
4. Summary — 1-2 предложения сути
5. key_points — 2-5 ключевых мыслей, каждая начинается с emoji
6. action_items — конкретные действия если есть (иначе пустой массив)
7. tags — 3-7 коротких тегов без #
8. Пиши живо, информативно, без воды
9. Отвечай СТРОГО в JSON формате, без markdown блоков`

// =========================================
// MAIN FUNCTION
// =========================================

export async function structureNote(rawText: string): Promise<StructuredNote> {
  const safe = sanitizeInput(rawText)

  if (!safe.trim()) {
    return { ...FALLBACK_NOTE, summary: 'Пустой текст заметки.' }
  }

  let lastError: Error | null = null

  // Retry up to 2 times
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const message = await client.messages.create({
        model: MODEL,
        max_tokens: MAX_TOKENS,
        system: SYSTEM_PROMPT,
        messages: [
          {
            role: 'user',
            content: `Структурируй эту голосовую заметку:\n\n"${safe}"\n\nОтвет ТОЛЬКО в JSON:\n{\n  "title": "...",\n  "category": "...",\n  "emoji": "...",\n  "summary": "...",\n  "key_points": ["...", "..."],\n  "action_items": ["...", "..."],\n  "tags": ["...", "..."]\n}`,
          },
        ],
      })

      const content = message.content[0]
      if (content.type !== 'text' || !content.text) {
        throw new Error('Empty response from Claude')
      }

      const parsed = safeParseJSON<StructuredNote>(content.text, FALLBACK_NOTE, 'structureNote')

      // Validate required fields
      return {
        title: parsed.title || FALLBACK_NOTE.title,
        category: parsed.category || FALLBACK_NOTE.category,
        emoji: parsed.emoji || FALLBACK_NOTE.emoji,
        summary: parsed.summary || FALLBACK_NOTE.summary,
        key_points: Array.isArray(parsed.key_points) ? parsed.key_points : [],
        action_items: Array.isArray(parsed.action_items) ? parsed.action_items : [],
        tags: Array.isArray(parsed.tags) ? parsed.tags : [],
      }
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err))
      console.error(`[AI] structureNote attempt ${attempt + 1} failed:`, lastError.message)

      if (attempt < 1) {
        // Wait 1 second before retry
        await new Promise(r => setTimeout(r, 1000))
      }
    }
  }

  console.error('[AI] structureNote failed after retries:', lastError?.message)
  return { ...FALLBACK_NOTE, summary: 'AI-сервис временно недоступен. Заметка сохранена как есть.' }
}
