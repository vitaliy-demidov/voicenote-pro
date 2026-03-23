import { useState, useRef, useCallback, useEffect } from 'react'

type RecorderState = 'idle' | 'recording' | 'processing'

type UseVoiceRecorderReturn = {
  state: RecorderState
  transcript: string
  duration: number
  startRecording: () => void
  stopRecording: () => string
  reset: () => void
  isSupported: boolean
}

export function useVoiceRecorder(): UseVoiceRecorderReturn {
  const [state, setState] = useState<RecorderState>('idle')
  const [transcript, setTranscript] = useState('')
  const [duration, setDuration] = useState(0)

  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const transcriptRef = useRef('')

  const isSupported = typeof window !== 'undefined' &&
    (typeof window.SpeechRecognition !== 'undefined' || typeof window.webkitSpeechRecognition !== 'undefined')

  const startTimer = useCallback(() => {
    setDuration(0)
    timerRef.current = setInterval(() => {
      setDuration(d => d + 1)
    }, 1000)
  }, [])

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const startRecording = useCallback(() => {
    if (!isSupported) return

    transcriptRef.current = ''
    setTranscript('')

    const SpeechRecognitionAPI =
      window.SpeechRecognition || window.webkitSpeechRecognition
    const recognition: SpeechRecognition = new SpeechRecognitionAPI()

    // Detect language from Telegram locale or browser settings
    const telegramLang = window.Telegram?.WebApp?.initDataUnsafe?.user?.language_code
    const langMap: Record<string, string> = {
      ru: 'ru-RU', uk: 'uk-UA', en: 'en-US',
      de: 'de-DE', fr: 'fr-FR', es: 'es-ES',
      it: 'it-IT', pt: 'pt-PT', pl: 'pl-PL',
    }
    const lang = telegramLang && langMap[telegramLang]
      ? langMap[telegramLang]
      : navigator.language || 'ru-RU'

    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = lang
    recognition.maxAlternatives = 1

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interimTranscript = ''
      let finalTranscript = transcriptRef.current

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i]
        if (result.isFinal) {
          finalTranscript += result[0].transcript + ' '
        } else {
          interimTranscript += result[0].transcript
        }
      }

      transcriptRef.current = finalTranscript
      setTranscript(finalTranscript + interimTranscript)
    }

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('Speech recognition error:', event.error)
      stopTimer()
      setState('idle')
    }

    recognition.onend = () => {
      stopTimer()
    }

    recognitionRef.current = recognition
    recognition.start()
    setState('recording')
    startTimer()
  }, [isSupported, startTimer, stopTimer])

  const stopRecording = useCallback((): string => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
      recognitionRef.current = null
    }
    stopTimer()
    setState('idle')
    return transcriptRef.current.trim()
  }, [stopTimer])

  const reset = useCallback(() => {
    stopTimer()
    if (recognitionRef.current) {
      recognitionRef.current.stop()
      recognitionRef.current = null
    }
    transcriptRef.current = ''
    setTranscript('')
    setDuration(0)
    setState('idle')
  }, [stopTimer])

  useEffect(() => {
    return () => {
      stopTimer()
      if (recognitionRef.current) recognitionRef.current.stop()
    }
  }, [stopTimer])

  return { state, transcript, duration, startRecording, stopRecording, reset, isSupported }
}

// Extend Window type
declare global {
  interface Window {
    SpeechRecognition: { new(): SpeechRecognition }
    webkitSpeechRecognition: { new(): SpeechRecognition }
    Telegram?: {
      WebApp?: {
        initData?: string
        initDataUnsafe?: {
          user?: {
            id: number
            first_name?: string
            last_name?: string
            username?: string
            language_code?: string
            is_premium?: boolean
          }
          hash?: string
          auth_date?: string
        }
        HapticFeedback?: {
          impactOccurred: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void
          notificationOccurred: (type: 'error' | 'success' | 'warning') => void
          selectionChanged: () => void
        }
        ready: () => void
        expand: () => void
        close: () => void
        themeParams?: Record<string, string>
        colorScheme?: 'light' | 'dark'
        isExpanded?: boolean
        viewportHeight?: number
        viewportStableHeight?: number
        MainButton?: {
          text: string
          color: string
          textColor: string
          isVisible: boolean
          isActive: boolean
          show: () => void
          hide: () => void
          setText: (text: string) => void
          onClick: (fn: () => void) => void
        }
      }
    }
  }
}
