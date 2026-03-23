import axios, { type AxiosError } from 'axios'
import type { Note, Category, Stats } from '../types'

// =========================================
// AXIOS INSTANCE
// =========================================

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add Telegram init data header if available
api.interceptors.request.use((config) => {
  const initData = window.Telegram?.WebApp?.initData
  if (initData) {
    config.headers['X-Telegram-Init-Data'] = initData
  }
  return config
})

// =========================================
// ERROR HANDLING
// =========================================

export class ApiError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

function handleError(err: unknown): never {
  if (axios.isAxiosError(err)) {
    const axiosErr = err as AxiosError<{ error?: string; retryAfter?: number }>
    const message = axiosErr.response?.data?.error || axiosErr.message || 'Ошибка сети'
    const status = axiosErr.response?.status || 0
    throw new ApiError(message, status)
  }
  throw err
}

// =========================================
// NOTES API
// =========================================

export const notesApi = {
  list: (params?: { user_id?: string; category?: string; limit?: number; offset?: number }) =>
    api.get<Note[]>('/notes', { params }).then(r => r.data).catch(handleError),

  get: (id: number, user_id = 'default') =>
    api.get<Note>(`/notes/${id}`, { params: { user_id } }).then(r => r.data).catch(handleError),

  create: (raw_text: string, user_id = 'default') =>
    api.post<Note>('/notes', { raw_text, user_id }).then(r => r.data).catch(handleError),

  update: (id: number, data: { user_id?: string; title?: string; summary?: string; category?: string; tags?: string[] }) =>
    api.put<Note>(`/notes/${id}`, data).then(r => r.data).catch(handleError),

  delete: (id: number, user_id = 'default') =>
    api.delete(`/notes/${id}`, { params: { user_id } }).then(r => r.data).catch(handleError),

  search: (q: string, user_id = 'default', limit = 30, offset = 0) =>
    api.get<Note[]>('/notes/search', { params: { q, user_id, limit, offset } }).then(r => r.data).catch(handleError),
}

// =========================================
// CATEGORIES API
// =========================================

export const categoriesApi = {
  list: (user_id = 'default') =>
    api.get<Category[]>('/categories', { params: { user_id } }).then(r => r.data).catch(handleError),

  stats: (user_id = 'default') =>
    api.get<Stats>('/categories/stats', { params: { user_id } }).then(r => r.data).catch(handleError),
}
