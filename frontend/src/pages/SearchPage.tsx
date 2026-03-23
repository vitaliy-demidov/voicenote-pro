import { useState, useCallback } from 'react'
import { NoteCard } from '../components/ui/NoteCard'
import { NoteDetailSheet } from '../components/ui/NoteDetailSheet'
import { useNotesStore } from '../store/notesStore'
import type { Note } from '../types'

export function SearchPage() {
  const { searchNotes, deleteNote } = useNotesStore()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Note[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const [selectedNote, setSelectedNote] = useState<Note | null>(null)

  const handleSearch = useCallback(async (q: string) => {
    setQuery(q)
    if (!q.trim()) {
      setResults([])
      setHasSearched(false)
      return
    }
    setIsSearching(true)
    try {
      const found = await searchNotes(q)
      setResults(found)
      setHasSearched(true)
    } finally {
      setIsSearching(false)
    }
  }, [searchNotes])

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-5 pt-5 pb-3">
        <h1 className="text-xl font-bold text-white mb-4">Поиск</h1>

        {/* Search input */}
        <div className="relative">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8" strokeWidth={2}/>
              <path strokeLinecap="round" strokeWidth={2} d="m21 21-4.35-4.35"/>
            </svg>
          </div>
          <input
            type="text"
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Найти заметки, теги, категории..."
            className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-white text-sm outline-none focus:border-indigo-500/50 placeholder-gray-600 transition-colors"
            autoFocus
          />
          {query && (
            <button
              onClick={() => handleSearch('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto px-5 pb-24 space-y-3">
        {isSearching ? (
          <div className="flex justify-center py-10">
            <div className="w-6 h-6 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
          </div>
        ) : hasSearched && results.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <span className="text-4xl">🔍</span>
            <p className="text-gray-500 text-sm text-center">
              Ничего не найдено по запросу «{query}»
            </p>
          </div>
        ) : results.length > 0 ? (
          <>
            <p className="text-gray-600 text-xs">Найдено: {results.length}</p>
            {results.map((note) => (
              <NoteCard
                key={note.id}
                note={note}
                onClick={setSelectedNote}
                onDelete={deleteNote}
              />
            ))}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <span className="text-5xl">🔮</span>
            <p className="text-gray-500 text-sm text-center">
              Поиск по всем заметкам, тегам и категориям
            </p>
          </div>
        )}
      </div>

      <NoteDetailSheet
        note={selectedNote}
        onClose={() => setSelectedNote(null)}
        onDelete={deleteNote}
      />
    </div>
  )
}
