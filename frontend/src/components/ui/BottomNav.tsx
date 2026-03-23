import clsx from 'clsx'

type Tab = 'record' | 'notes' | 'categories' | 'search'

type BottomNavProps = {
  active: Tab
  onChange: (tab: Tab) => void
}

const TABS: { id: Tab; label: string; icon: JSX.Element }[] = [
  {
    id: 'record',
    label: 'Запись',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18.5A6.5 6.5 0 0 1 5.5 12V10a6.5 6.5 0 0 1 13 0v2a6.5 6.5 0 0 1-6.5 6.5z"/>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2v2M12 22v-2M19.07 4.93l-1.41 1.41M6.34 17.66l-1.41 1.41"/>
      </svg>
    ),
  },
  {
    id: 'notes',
    label: 'Заметки',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
      </svg>
    ),
  },
  {
    id: 'categories',
    label: 'Разделы',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
      </svg>
    ),
  },
  {
    id: 'search',
    label: 'Поиск',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <circle cx="11" cy="11" r="8" strokeWidth={2}/>
        <path strokeLinecap="round" strokeWidth={2} d="m21 21-4.35-4.35"/>
      </svg>
    ),
  },
]

export function BottomNav({ active, onChange }: BottomNavProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-[#0f0f1a]/95 backdrop-blur-xl border-t border-white/10 z-50 pb-safe">
      <div className="flex items-center justify-around px-2 py-2">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={clsx(
              'flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-xl transition-all duration-200 min-w-[60px]',
              active === tab.id
                ? 'text-indigo-400'
                : 'text-gray-600 hover:text-gray-400'
            )}
          >
            <div className={clsx(
              'transition-transform duration-200',
              active === tab.id ? 'scale-110' : 'scale-100'
            )}>
              {tab.icon}
            </div>
            <span className="text-[10px] font-medium">{tab.label}</span>
          </button>
        ))}
      </div>
    </nav>
  )
}
