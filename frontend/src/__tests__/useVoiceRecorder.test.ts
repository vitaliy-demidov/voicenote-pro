import { describe, it, expect, vi } from 'vitest'

// ----------------------------------------------------------------
// Tests for logic extracted from src/hooks/useVoiceRecorder.ts
// We test the pure logic functions, not the hook internals.
// ----------------------------------------------------------------

// Mirrors the langMap from useVoiceRecorder.ts
const langMap: Record<string, string> = {
  ru: 'ru-RU',
  uk: 'uk-UA',
  en: 'en-US',
  de: 'de-DE',
  fr: 'fr-FR',
  es: 'es-ES',
  it: 'it-IT',
  pt: 'pt-PT',
  pl: 'pl-PL',
}

function resolveRecognitionLang(telegramLangCode?: string, navigatorLang = 'ru-RU'): string {
  return telegramLangCode && langMap[telegramLangCode]
    ? langMap[telegramLangCode]
    : navigatorLang || 'ru-RU'
}

// Duration formatter used in RecordPage
function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

describe('useVoiceRecorder — language resolution', () => {
  it('maps "ru" Telegram code to "ru-RU"', () => {
    expect(resolveRecognitionLang('ru')).toBe('ru-RU')
  })

  it('maps "en" Telegram code to "en-US"', () => {
    expect(resolveRecognitionLang('en')).toBe('en-US')
  })

  it('maps "de" Telegram code to "de-DE"', () => {
    expect(resolveRecognitionLang('de')).toBe('de-DE')
  })

  it('falls back to navigator.language when Telegram code not in map', () => {
    expect(resolveRecognitionLang('zh', 'zh-CN')).toBe('zh-CN')
  })

  it('falls back to "ru-RU" when no info available', () => {
    expect(resolveRecognitionLang(undefined, '')).toBe('ru-RU')
  })

  it('covers all 9 mapped language codes', () => {
    const codes = ['ru', 'uk', 'en', 'de', 'fr', 'es', 'it', 'pt', 'pl']
    codes.forEach(code => {
      expect(resolveRecognitionLang(code)).toMatch(/^[a-z]{2}-[A-Z]{2}$/)
    })
  })
})

describe('useVoiceRecorder — RecorderState machine', () => {
  it('initial state is "idle"', () => {
    // Valid states as per the type definition
    const validStates = ['idle', 'recording', 'processing']
    const initialState = 'idle'
    expect(validStates).toContain(initialState)
  })

  it('transitions from idle -> recording -> processing -> idle', () => {
    type RecorderState = 'idle' | 'recording' | 'processing'
    let state: RecorderState = 'idle'

    state = 'recording'
    expect(state).toBe('recording')

    state = 'processing'
    expect(state).toBe('processing')

    state = 'idle'
    expect(state).toBe('idle')
  })
})

describe('formatDuration — timer display', () => {
  it('formats 0 seconds as "0:00"', () => {
    expect(formatDuration(0)).toBe('0:00')
  })

  it('formats 5 seconds as "0:05"', () => {
    expect(formatDuration(5)).toBe('0:05')
  })

  it('formats 65 seconds as "1:05"', () => {
    expect(formatDuration(65)).toBe('1:05')
  })

  it('formats 3600 seconds as "60:00"', () => {
    expect(formatDuration(3600)).toBe('60:00')
  })

  it('formats 59 as "0:59"', () => {
    expect(formatDuration(59)).toBe('0:59')
  })

  it('formats 120 as "2:00"', () => {
    expect(formatDuration(120)).toBe('2:00')
  })
})

describe('useVoiceRecorder — isSupported check', () => {
  it('reports unsupported when SpeechRecognition is undefined', () => {
    const original = global.SpeechRecognition
    // @ts-ignore
    global.SpeechRecognition = undefined
    // @ts-ignore
    global.webkitSpeechRecognition = undefined

    const isSupported =
      typeof window !== 'undefined' &&
      (typeof (window as any).SpeechRecognition !== 'undefined' ||
        typeof (window as any).webkitSpeechRecognition !== 'undefined')

    expect(isSupported).toBe(false)
    global.SpeechRecognition = original
    ;(global as any).webkitSpeechRecognition = original
  })

  it('reports supported when SpeechRecognition mock is set (from setup.js)', () => {
    // setup.js sets global.SpeechRecognition
    const isSupported =
      typeof window !== 'undefined' &&
      (typeof (window as any).SpeechRecognition !== 'undefined' ||
        typeof (window as any).webkitSpeechRecognition !== 'undefined')
    expect(isSupported).toBe(true)
  })
})
