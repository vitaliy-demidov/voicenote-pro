import { useEffect } from 'react'
import { useNotesStore } from '../store/notesStore'

const CATEGORY_BG: Record<string, string> = {
  'Работа': 'from-blue-600/30 to-blue-600/5',
  'Идеи': 'from-amber-600/30 to-amber-600/5',
  'Обучение': 'from-emerald-600/30 to-emerald-600/5',
  'Здоровье': 'from-red-600/30 to-red-600/5',
  'Финансы': 'from-lime-600/30 to-lime-600/5',
  'Путешествия': 'from-cyan-600/30 to-cyan-600/5',
  'Вкус и стиль': 'from-purple-600/30 to-purple-600/5',
  'Общее': 'from-gray-600/30 to-gray-600/5',
}

export function CategoriesPage() {
  const { categories, stats, fetchCategories, fetchStats, setCategory } = useNotesStore()

  useEffect(() => {
    fetchCategories()
    fetchStats()
  }, [fetchCategories, fetchStats])

  return (
    <div className="flex flex-col h-full overflow-y-auto pb-24">
      {/* Header */}
      <div className="px-5 pt-5 pb-4">
        <h1 className="text-xl font-bold text-white mb-1">Умный блокнот</h1>
        <p className="text-gray-500 text-xs">Все знания под рукой</p>
      </div>

      {/* Stats */}
      {stats && (
        <div className="px-5 mb-5">
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-3 text-center">
              <p className="text-2xl font-bold text-white">{stats.total}</p>
              <p className="text-gray-500 text-xs mt-0.5">всего</p>
            </div>
            <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-2xl p-3 text-center">
              <p className="text-2xl font-bold text-indigo-400">{stats.today}</p>
              <p className="text-gray-500 text-xs mt-0.5">сегодня</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-3 text-center">
              <p className="text-lg font-bold text-white">{categories.length}</p>
              <p className="text-gray-500 text-xs mt-0.5">разделов</p>
            </div>
          </div>
          {stats.top_category && (
            <p className="text-gray-600 text-xs text-center mt-3">
              Чаще всего: <span className="text-gray-400">{stats.top_category}</span>
            </p>
          )}
        </div>
      )}

      {/* Categories grid */}
      <div className="px-5">
        <h2 className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-3">
          Разделы
        </h2>
        <div className="grid grid-cols-2 gap-3">
          {categories.map((cat) => (
            <button
              key={cat.name}
              onClick={() => setCategory(cat.name)}
              className={`bg-gradient-to-br ${CATEGORY_BG[cat.name] || 'from-gray-600/30 to-gray-600/5'} border border-white/10 rounded-2xl p-4 text-left transition-all duration-200 active:scale-95 hover:border-white/20`}
            >
              <span className="text-3xl block mb-2">{cat.emoji}</span>
              <p className="text-white font-semibold text-sm">{cat.name}</p>
              <p className="text-gray-500 text-xs mt-0.5">
                {cat.count} {cat.count === 1 ? 'заметка' : cat.count < 5 ? 'заметки' : 'заметок'}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Tips */}
      <div className="px-5 mt-6">
        <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-2xl p-4">
          <p className="text-indigo-300 text-xs font-semibold mb-2">💡 Как использовать</p>
          <ul className="space-y-1">
            {[
              'Запиши идею голосом — AI сам структурирует',
              'Категория определяется автоматически',
              'Все заметки сохраняются навсегда',
              'Поиск по всем заметкам',
            ].map((tip, i) => (
              <li key={i} className="text-gray-500 text-xs flex items-start gap-1.5">
                <span className="text-indigo-400 mt-0.5">•</span>
                {tip}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
