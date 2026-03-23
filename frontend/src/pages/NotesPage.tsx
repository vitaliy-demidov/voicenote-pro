import { useEffect, useState } from 'react'
import { NoteCard } from '../components/ui/NoteCard'
import { NoteDetailSheet } from '../components/ui/NoteDetailSheet'
import { useNotesStore } from '../store/notesStore'
import type { Note } from '../types'

export function NotesPage() {
  const { notes, categories, activeCategory, fetchNotes, deleteNote, setCategory, isLoading } = useNotesStore()
  const [selectedNote, setSelectedNote] = useState<Note | null>(null)

  useEffect(() => {
    fetchNotes()
  }, [fetchNotes])

  const allCount = notes.length

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-5 pt-5 pb-3">
        <h1 className="text-xl font-bold text-white mb-1">Мои заметки</h1>
        <p className="text-gray-500 text-xs">{allCount} заметок</p>
      </div>

      {/* Category filter */}
      <div className="overflow-x-auto px-5 mb-3 scrollbar-none">
        <div className="flex gap-2 min-w-max">
          <button
            onClick={() => setCategory('all')}
            className={`flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
              activeCategory === 'all'
                ? 'bg-indigo-600 text-white'
                : 'bg-white/5 text-gray-400 border border-white/10'
            }`}
          >
            Все
          </button>
          {categories.map((cat) => (
            <button
              key={cat.name}
              onClick={() => setCategory(cat.name)}
              className={`flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-medium transition-all duration-200 flex items-center gap-1 ${
                activeCategory === cat.name
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white/5 text-gray-400 border border-white/10'
              }`}
            >
              {cat.emoji} {cat.name}
              {cat.count > 0 && (
                <span className={`ml-1 ${activeCategory === cat.name ? 'text-indigo-200' : 'text-gray-600'}`}>
                  {cat.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Notes list */}
      <div className="flex-1 overflow-y-auto px-5 pb-24 space-y-3">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="w-8 h-8 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
            <p className="text-gray-600 text-sm">Загружаю...</p>
          </div>
        ) : notes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <span className="text-5xl">📝</span>
            <p className="text-gray-500 text-sm text-center">
              {activeCategory === 'all'
                ? 'Заметок пока нет. Запиши первую идею!'
                : `Нет заметок в категории "${activeCategory}"`}
            </p>
          </div>
        ) : (
          notes.map((note) => (
            <NoteCard
              key={note.id}
              note={note}
              onClick={setSelectedNote}
              onDelete={deleteNote}
            />
          ))
        )}
      </div>

      {/* Detail sheet */}
      <NoteDetailSheet
        note={selectedNote}
        onClose={() => setSelectedNote(null)}
        onDelete={deleteNote}
      />
    </div>
  )
}
