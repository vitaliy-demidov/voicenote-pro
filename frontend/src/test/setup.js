import '@testing-library/jest-dom'

// Mock Web Audio API
global.AudioContext = vi.fn(() => ({
  createMediaStreamSource: vi.fn(),
  createAnalyser: vi.fn(),
  close: vi.fn(),
}))

global.MediaRecorder = vi.fn(() => ({
  start: vi.fn(),
  stop: vi.fn(),
  addEventListener: vi.fn(),
  state: 'inactive',
}))
global.MediaRecorder.isTypeSupported = vi.fn(() => false)

// Mock SpeechRecognition
global.SpeechRecognition = vi.fn(() => ({
  start: vi.fn(),
  stop: vi.fn(),
  abort: vi.fn(),
  continuous: false,
  interimResults: false,
  lang: '',
  maxAlternatives: 1,
  onresult: null,
  onerror: null,
  onend: null,
}))
global.webkitSpeechRecognition = global.SpeechRecognition

// Mock Telegram WebApp
global.window = global.window || {}
global.window.Telegram = {
  WebApp: {
    ready: vi.fn(),
    expand: vi.fn(),
    initData: '',
    initDataUnsafe: { user: { id: 12345, language_code: 'ru' } },
  },
}
