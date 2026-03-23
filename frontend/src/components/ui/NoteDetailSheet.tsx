import { useEffect, useState } from 'react'
import clsx from 'clsx'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import type { Note } from '../../types'

type NoteDetailSheetProps = {
  note: Note | null
  onClose: () => void
  onDelete?: (id: number) => void
}

export function NoteDetailSheet({ note, onClose, onDelete }: NoteDetailSheetProps) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (note) {
      setTimeout(() => setVisible(true), 10)
    } else {
      setVisible(false)
    }
  }, [note])

  const handleClose = () => {
    setVisible(false)
    setTimeout(onClose, 300)
  }

  const handleDelete = () => {
    if (note && onDelete) {
      onDelete(note.id)
      handleClose()
    }
  }

  if (!note) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className={clsx(
          'fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity duration-300',
          visible ? 'opacity-100' : 'opacity-0'
        )}
        onClick={handleClose}
      />

      {/* Sheet */}
      <div
        className={clsx(
          'fixed bottom-0 left-0 right-0 z-50 bg-[#13132b] rounded-t-3xl',
          'max-h-[90vh] overflow-y-auto',
          'transition-transform duration-300 ease-out',
          visible ? 'translate-y-0' : 'translate-y-full'
        )}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-white/20 rounded-full" />
        </div>

        <div className="px-5 pb-10">
          {/* Header */}
          <div className="flex items-start justify-between gap-3 mb-4 mt-2">
            <div className="flex items-center gap-3 flex-1">
              <span className="text-4xl">{note.emoji}</span>
              <h2 className="text-white text-xl font-bold leading-tight">{note.title}</h2>
            </div>
            <button onClick={handleClose} className="text-gray-500 hover:text-gray-300 p-1">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Meta */}
          <div className="flex items-center gap-3 mb-5">
            <span className="bg-indigo-500/20 text-indigo-300 text-xs px-3 py-1 rounded-full font-medium">
              {note.category}
            </span>
            <span className="text-gray-600 text-xs">
              {format(new Date(note.created_at), 'd MMMM yyyy, HH:mm', { locale: ru })}
            </span>
          </div>

          {/* Summary */}
          <div className="bg-white/5 rounded-2xl p-4 mb-4">
            <p className="text-gray-300 text-sm leading-relaxed">{note.summary}</p>
          </div>

          {/* Key Points */}
          {note.key_points.length > 0 && (
            <div className="mb-4">
              <h3 className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-3">
                Ключевые мысли
              </h3>
              <div className="space-y-2">
                {note.key_points.map((point, i) => (
                  <div key={i} className="flex items-start gap-2 bg-white/5 rounded-xl p-3">
                    <span className="text-sm flex-shrink-0 mt-0.5">→</span>
                    <p className="text-gray-300 text-sm leading-relaxed">{point}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Items */}
          {note.action_items.length > 0 && (
            <div className="mb-4">
              <h3 className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-3">
                Действия
              </h3>
              <div className="space-y-2">
                {note.action_items.map((item, i) => (
                  <div key={i} className="flex items-start gap-3 bg-amber-500/10 border border-amber-500/20 rounded-xl p-3">
                    <div className="w-5 h-5 border-2 border-amber-500/50 rounded mt-0.5 flex-shrink-0" />
                    <p className="text-amber-200 text-sm leading-relaxed">{item}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tags */}
          {note.tags.length > 0 && (
            <div className="mb-4">
              <div className="flex flex-wrap gap-2">
                {note.tags.map((tag, i) => (
                  <span key={i} className="text-xs text-gray-500 bg-white/5 px-2 py-1 rounded-lg">
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Raw text (collapsible) */}
          <details className="mb-6">
            <summary className="text-gray-600 text-xs cursor-pointer hover:text-gray-400 transition-colors">
              Исходный текст
            </summary>
            <p className="text-gray-700 text-xs mt-2 leading-relaxed italic">
              {note.raw_text}
            </p>
          </details>

          {/* Delete button */}
          {onDelete && (
            <button
              onClick={handleDelete}
              className="w-full bg-red-500/10 border border-red-500/20 text-red-400 rounded-2xl py-3 text-sm font-medium hover:bg-red-500/20 transition-colors"
            >
              Удалить заметку
            </button>
          )}
        </div>
      </div>
    </>
  )
}
