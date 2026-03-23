import { useState, useCallback } from 'react'
import clsx from 'clsx'
import { MicButton } from '../components/ui/MicButton'
import { NoteDetailSheet } from '../components/ui/NoteDetailSheet'
import { useVoiceRecorder } from '../hooks/useVoiceRecorder'
import { useNotesStore } from '../store/notesStore'
import type { Note } from '../types'

export function RecordPage() {
  const { state, transcript, duration, startRecording, stopRecording, reset, isSupported } = useVoiceRecorder()
  const { addNote, isProcessing, error, clearError } = useNotesStore()
  const [newNote, setNewNote] = useState<Note | null>(null)
  const [localError, setLocalError] = useState<string | null>(null)

  const handleMicClick = useCallback(async () => {
    if (state === 'recording') {
      const text = stopRecording()
      if (!text.trim()) {
        setLocalError('Ничего не записано. Попробуй ещё раз!')
        return
      }
      try {
        const note = await addNote(text)
        setNewNote(note)
      } catch {
        // error handled in store
      }
    } else {
      setLocalError(null)
      clearError()
      startRecording()
    }
  }, [state, stopRecording, addNote, startRecording, clearError])

  const handleManualInput = async (text: string) => {
    if (!text.trim()) return
    try {
      const note = await addNote(text)
      setNewNote(note)
    } catch {
      // handled in store
    }
  }

  const [showManual, setShowManual] = useState(false)
  const [manualText, setManualText] = useState('')

  return (
    <div className="flex flex-col items-center justify-center min-h-full px-6 py-8 gap-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-2xl font-bold text-white mb-1">VoiceNote Pro</h1>
        <p className="text-gray-500 text-sm">Умный блокнот для твоих идей</p>
      </div>

      {/* Not supported warning */}
      {!isSupported && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 text-center">
          <p className="text-amber-300 text-sm">
            Голосовой ввод недоступен в этом браузере.{' '}
            <button className="underline" onClick={() => setShowManual(true)}>
              Введи текст вручную
            </button>
          </p>
        </div>
      )}

      {/* Mic Button */}
      <MicButton
        isRecording={state === 'recording'}
        isProcessing={isProcessing}
        duration={duration}
        onClick={handleMicClick}
        disabled={isProcessing}
      />

      {/* Live transcript preview */}
      {transcript && (
        <div className="w-full max-w-sm bg-white/5 border border-white/10 rounded-2xl p-4 animate-fade-in">
          <p className="text-gray-300 text-sm leading-relaxed text-center italic">
            "{transcript}"
          </p>
        </div>
      )}

      {/* Error */}
      {(error || localError) && (
        <div
          className="bg-red-500/10 border border-red-500/30 rounded-2xl px-4 py-3 flex items-center gap-2 cursor-pointer"
          onClick={() => { clearError(); setLocalError(null) }}
        >
          <span>⚠️</span>
          <p className="text-red-400 text-sm">{error || localError}</p>
        </div>
      )}

      {/* Manual input toggle */}
      {isSupported && !state.includes('recording') && (
        <button
          onClick={() => setShowManual(!showManual)}
          className="text-gray-600 text-xs underline underline-offset-2 hover:text-gray-400 transition-colors"
        >
          {showManual ? 'Скрыть' : 'Или введи текст вручную'}
        </button>
      )}

      {/* Manual text input */}
      {showManual && (
        <div className="w-full max-w-sm space-y-3 animate-slide-up">
          <textarea
            value={manualText}
            onChange={(e) => setManualText(e.target.value)}
            placeholder="Напиши свою идею, мысль или заметку..."
            className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white text-sm resize-none outline-none focus:border-indigo-500/50 placeholder-gray-600"
            rows={4}
          />
          <button
            onClick={() => { handleManualInput(manualText); setManualText('') }}
            disabled={!manualText.trim() || isProcessing}
            className={clsx(
              'w-full py-3 rounded-2xl text-sm font-semibold transition-all duration-200',
              manualText.trim() && !isProcessing
                ? 'bg-indigo-600 text-white hover:bg-indigo-500'
                : 'bg-white/5 text-gray-600 cursor-not-allowed'
            )}
          >
            {isProcessing ? 'Обрабатываю...' : '✨ Структурировать'}
          </button>
        </div>
      )}

      {/* Tips */}
      {!state.includes('recording') && !isProcessing && (
        <div className="w-full max-w-sm">
          <div className="bg-white/3 rounded-2xl p-4 space-y-2">
            <p className="text-gray-600 text-xs text-center font-medium mb-3">Примеры</p>
            {[
              '🥃 Виски — изучить виды, регионы, как выбирать',
              '💡 Идея для приложения по учёту финансов',
              '✈️ Поездка в Таиланд — что посмотреть, отели',
            ].map((example, i) => (
              <button
                key={i}
                onClick={() => handleManualInput(example)}
                disabled={isProcessing}
                className="w-full text-left text-gray-600 text-xs py-2 px-3 rounded-xl hover:bg-white/5 transition-colors"
              >
                {example}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* New note detail sheet */}
      <NoteDetailSheet
        note={newNote}
        onClose={() => { setNewNote(null); reset() }}
      />
    </div>
  )
}
