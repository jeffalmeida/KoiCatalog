import { useState } from 'react'
import './App.css'
import { CatalogPage } from './pages/CatalogPage'
import { StudyPage } from './pages/StudyPage'
import { AddKoiPage } from './pages/AddKoiPage'

type Route = 'catalog' | 'study' | 'add'

const ROOT_STYLE: React.CSSProperties = {
  minHeight: '100vh',
}

export default function App() {
  const [route, setRoute] = useState<Route>('catalog')

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div style={ROOT_STYLE}>
        <header className="border-b border-white/10 bg-slate-950/80 backdrop-blur">
          <div className="mx-auto flex max-w-6xl items-center gap-1 px-4 py-3">
            <div className="flex items-center gap-2 text-white">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500 text-lg font-bold text-slate-950">
                K
              </span>
              <span className="hidden text-lg font-bold sm:inline">Koi Cards</span>
            </div>
            <nav className="ml-auto flex items-center gap-1 rounded-lg bg-white/5 p-1">
              {(
                [
                  { id: 'catalog', label: 'Catálogo' },
                  { id: 'study', label: 'Estudar' },
                  { id: 'add', label: '+ Nova' },
                ] as { id: Route; label: string }[]
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setRoute(tab.id)}
                  className={
                    'rounded-md px-3 py-1.5 text-sm font-medium transition ' +
                    (route === tab.id
                      ? 'bg-cyan-500/20 text-cyan-300'
                      : 'text-slate-400 hover:bg-white/10 hover:text-white')
                  }
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </header>

        <main>
          {route === 'catalog' && <CatalogPage />}
          {route === 'study' && <StudyPage />}
          {route === 'add' && <AddKoiPage />}
        </main>

        <footer className="mt-10 border-t border-white/10 py-6 text-center text-xs text-slate-600">
          Koi Cards · flashcards para memorizar os tipos de carpa koi
        </footer>
      </div>
    </div>
  )
}