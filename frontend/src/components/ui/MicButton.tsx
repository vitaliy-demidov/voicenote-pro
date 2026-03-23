import { useEffect, useRef } from 'react'
import clsx from 'clsx'

type MicButtonProps = {
  isRecording: boolean
  isProcessing: boolean
  duration: number
  onClick: () => void
  disabled?: boolean
}

const formatDuration = (s: number) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`

export function MicButton({ isRecording, isProcessing, duration, onClick, disabled }: MicButtonProps) {
  const audioCtxRef = useRef<AudioContext | null>(null)

  const vibrate = (pattern: number[]) => {
    if (navigator.vibrate) navigator.vibrate(pattern)
    if (window.Telegram?.WebApp?.HapticFeedback) {
      window.Telegram.WebApp.HapticFeedback.impactOccurred('medium')
    }
  }

  const handleClick = () => {
    if (isRecording) vibrate([30])
    else vibrate([50])
    onClick()
  }

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Duration */}
      <div className={clsx(
        'text-2xl font-mono font-bold transition-all duration-300',
        isRecording ? 'text-red-400 opacity-100' : 'opacity-0'
      )}>
        {formatDuration(duration)}
      </div>

      {/* Button container with ripple */}
      <div className="relative flex items-center justify-center">
        {/* Ripple rings when recording */}
        {isRecording && (
          <>
            <div className="absolute inset-0 rounded-full bg-red-500/20 animate-ripple" style={{ animationDelay: '0ms' }} />
            <div className="absolute inset-0 rounded-full bg-red-500/15 animate-ripple" style={{ animationDelay: '500ms' }} />
            <div className="absolute inset-0 rounded-full bg-red-500/10 animate-ripple" style={{ animationDelay: '1000ms' }} />
          </>
        )}

        {/* Processing ring */}
        {isProcessing && (
          <div className="absolute inset-[-8px] rounded-full border-4 border-indigo-500/30 border-t-indigo-500 animate-spin" />
        )}

        {/* Main button */}
        <button
          onClick={handleClick}
          disabled={disabled || isProcessing}
          className={clsx(
            'w-28 h-28 rounded-full flex items-center justify-center',
            'transition-all duration-200 active:scale-95',
            'shadow-2xl relative z-10',
            isRecording
              ? 'bg-red-500 shadow-red-500/40'
              : isProcessing
              ? 'bg-indigo-500/50 cursor-not-allowed'
              : 'bg-indigo-600 shadow-indigo-500/40 hover:bg-indigo-500'
          )}
        >
          {isProcessing ? (
            <span className="text-4xl">✨</span>
          ) : isRecording ? (
            <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 24 24">
              <rect x="6" y="6" width="12" height="12" rx="2" />
            </svg>
          ) : (
            <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"/>
              <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
              <line x1="12" y1="19" x2="12" y2="22" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round"/>
              <line x1="8" y1="22" x2="16" y2="22" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round"/>
            </svg>
          )}
        </button>
      </div>

      {/* Status text */}
      <p className={clsx(
        'text-sm font-medium transition-all duration-300',
        isRecording ? 'text-red-400' : isProcessing ? 'text-indigo-400' : 'text-gray-400'
      )}>
        {isProcessing ? 'AI обрабатывает...' : isRecording ? 'Говори — слушаю...' : 'Нажми и говори'}
      </p>
    </div>
  )
}
