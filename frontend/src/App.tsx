import { useState, useEffect } from 'react'
import { BottomNav } from './components/ui/BottomNav'
import { RecordPage } from './pages/RecordPage'
import { NotesPage } from './pages/NotesPage'
import { CategoriesPage } from './pages/CategoriesPage'
import { SearchPage } from './pages/SearchPage'
import { useNotesStore } from './store/notesStore'

type Tab = 'record' | 'notes' | 'categories' | 'search'

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('record')
  const { fetchNotes, fetchCategories, fetchStats } = useNotesStore()

  useEffect(() => {
    // Init Telegram WebApp
    if (window.Telegram?.WebApp) {
      window.Telegram.WebApp.ready()
      window.Telegram.WebApp.expand()
    }

    // Load initial data
    fetchNotes()
    fetchCategories()
    fetchStats()
  }, [fetchNotes, fetchCategories, fetchStats])

  // When switching to notes tab, trigger navigation in NotesPage via store
  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab)
  }

  return (
    <div className="min-h-screen bg-[#0f0f1a] text-white flex flex-col">
      {/* Page content */}
      <main className="flex-1 overflow-hidden" style={{ paddingBottom: '72px' }}>
        <div className="h-full overflow-y-auto">
          {activeTab === 'record' && <RecordPage />}
          {activeTab === 'notes' && <NotesPage />}
          {activeTab === 'categories' && <CategoriesPage />}
          {activeTab === 'search' && <SearchPage />}
        </div>
      </main>

      {/* Bottom navigation */}
      <BottomNav active={activeTab} onChange={handleTabChange} />
    </div>
  )
}
