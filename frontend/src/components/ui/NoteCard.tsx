import clsx from 'clsx'
import { formatDistanceToNow } from 'date-fns'
import { ru } from 'date-fns/locale'
import type { Note } from '../../types'

type NoteCardProps = {
  note: Note
  onClick: (note: Note) => void
  onDelete?: (id: number) => void
}

const CATEGORY_COLORS: Record<string, string> = {
  'Работа': 'bg-blue-500/20 text-blue-300',
  'Идеи': 'bg-amber-500/20 text-amber-300',
  'Обучение': 'bg-emerald-500/20 text-emerald-300',
  'Здоровье': 'bg-red-500/20 text-red-300',
  'Финансы': 'bg-lime-500/20 text-lime-300',
  'Путешествия': 'bg-cyan-500/20 text-cyan-300',
  'Вкус и стиль': 'bg-purple-500/20 text-purple-300',
  'Общее': 'bg-gray-500/20 text-gray-300',
}

export function NoteCard({ note, onClick, onDelete }: NoteCardProps) {
  const categoryColor = CATEGORY_COLORS[note.category] || 'bg-gray-500/20 text-gray-300'
  const timeAgo = formatDistanceToNow(new Date(note.created_at), { addSuffix: true, locale: ru })

  return (
    <div
      className={clsx(
        'bg-white/5 border border-white/10 rounded-2xl p-4',
        'active:scale-[0.98] transition-all duration-150 cursor-pointer',
        'hover:bg-white/8 hover:border-white/20',
        'animate-fade-in'
      )}
      onClick={() => onClick(note)}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className="text-xl flex-shrink-0">{note.emoji}</span>
          <h3 className="text-white font-semibold text-sm leading-tight line-clamp-2">
            {note.title}
          </h3>
        </div>
        {onDelete && (
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(note.id) }}
            className="text-gray-600 hover:text-red-400 transition-colors p-1 flex-shrink-0"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Summary */}
      <p className="text-gray-400 text-xs leading-relaxed line-clamp-2 mb-3">
        {note.summary}
      </p>

      {/* Key points preview */}
      {note.key_points.length > 0 && (
        <div className="mb-3">
          {note.key_points.slice(0, 2).map((point, i) => (
            <p key={i} className="text-gray-500 text-xs line-clamp-1 mb-0.5">
              {point}
            </p>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between gap-2">
        <span className={clsx('text-xs px-2 py-0.5 rounded-full font-medium', categoryColor)}>
          {note.category}
        </span>
        <span className="text-gray-600 text-xs">{timeAgo}</span>
      </div>

      {/* Tags */}
      {note.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {note.tags.slice(0, 3).map((tag, i) => (
            <span key={i} className="text-xs text-gray-600 bg-white/5 px-1.5 py-0.5 rounded-md">
              #{tag}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
