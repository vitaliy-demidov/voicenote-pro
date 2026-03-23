import { create } from 'zustand'
import type { Note, Category, Stats } from '../types'
import { notesApi, categoriesApi, ApiError } from '../api/client'

// =========================================
// TYPES
// =========================================

type NotesStore = {
  notes: Note[]
  categories: Category[]
  stats: Stats | null
  activeCategory: string
  isLoading: boolean
  isProcessing: boolean
  error: string | null

  fetchNotes: (category?: string) => Promise<void>
  fetchCategories: () => Promise<void>
  fetchStats: () => Promise<void>
  addNote: (rawText: string) => Promise<Note>
  updateNote: (id: number, data: { title?: string; summary?: string; category?: string; tags?: string[] }) => Promise<Note>
  deleteNote: (id: number) => Promise<void>
  searchNotes: (q: string) => Promise<Note[]>
  setCategory: (cat: string) => void
  clearError: () => void
}

// =========================================
// USER ID
// =========================================

export const getUserId = (): string => {
  if (typeof window !== 'undefined' && window.Telegram?.WebApp?.initDataUnsafe?.user?.id) {
    return String(window.Telegram.WebApp.initDataUnsafe.user.id)
  }
  return 'default'
}

// =========================================
// ERROR FORMATTING
// =========================================

function formatError(err: unknown, fallback = 'Ошибка. Попробуй снова.'): string {
  if (err instanceof ApiError) {
    if (err.status === 429) return 'Слишком много запросов. Подожди минуту.'
    if (err.status === 400) return err.message
    if (err.status === 404) return 'Заметка не найдена.'
    if (err.status === 401) return 'Ошибка авторизации.'
    return err.message || fallback
  }
  if (err instanceof Error) return err.message || fallback
  return fallback
}

// =========================================
// STORE
// =========================================

export const useNotesStore = create<NotesStore>((set, get) => ({
  notes: [],
  categories: [],
  stats: null,
  activeCategory: 'all',
  isLoading: false,
  isProcessing: false,
  error: null,

  fetchNotes: async (category) => {
    set({ isLoading: true, error: null })
    try {
      const userId = getUserId()
      const cat = category ?? get().activeCategory
      const notes = await notesApi.list({
        user_id: userId,
        category: cat === 'all' ? undefined : cat,
      })
      set({ notes, isLoading: false })
    } catch (err) {
      set({
        error: formatError(err, 'Ошибка загрузки заметок'),
        isLoading: false,
      })
    }
  },

  fetchCategories: async () => {
    try {
      const categories = await categoriesApi.list(getUserId())
      set({ categories })
    } catch (err) {
      console.warn('[store] fetchCategories failed:', err)
    }
  },

  fetchStats: async () => {
    try {
      const stats = await categoriesApi.stats(getUserId())
      set({ stats })
    } catch (err) {
      console.warn('[store] fetchStats failed:', err)
    }
  },

  addNote: async (rawText: string) => {
    set({ isProcessing: true, error: null })
    try {
      const note = await notesApi.create(rawText, getUserId())
      set(state => ({
        notes: [note, ...state.notes],
        isProcessing: false,
      }))
      get().fetchCategories()
      get().fetchStats()
      return note
    } catch (err) {
      const message = formatError(err, 'Ошибка обработки заметки. Попробуй снова.')
      set({ isProcessing: false, error: message })
      throw err
    }
  },

  updateNote: async (id: number, data) => {
    const userId = getUserId()
    try {
      const updated = await notesApi.update(id, { user_id: userId, ...data })
      set(state => ({
        notes: state.notes.map(n => n.id === id ? updated : n),
      }))
      return updated
    } catch (err) {
      const message = formatError(err, 'Ошибка обновления заметки.')
      set({ error: message })
      throw err
    }
  },

  deleteNote: async (id: number) => {
    try {
      await notesApi.delete(id, getUserId())
      set(state => ({ notes: state.notes.filter(n => n.id !== id) }))
      get().fetchCategories()
      get().fetchStats()
    } catch (err) {
      const message = formatError(err, 'Ошибка удаления заметки.')
      set({ error: message })
      throw err
    }
  },

  searchNotes: async (q: string) => {
    try {
      return await notesApi.search(q, getUserId())
    } catch (err) {
      console.warn('[store] searchNotes failed:', err)
      return []
    }
  },

  setCategory: (cat: string) => {
    set({ activeCategory: cat })
    get().fetchNotes(cat)
  },

  clearError: () => set({ error: null }),
}))
