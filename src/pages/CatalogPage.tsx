import { useMemo, useState } from 'react'
import type { Koi } from '../types'
import { useKoiCatalog } from '../hooks/useKoiCatalog'
import { KoiCard } from '../components/KoiCard'
import { KoiDetailsModal } from '../components/KoiDetailsModal'
import { KoiForm } from '../components/KoiForm'
import { useToast } from '../components/toastContext'

const SEARCHABLE_FIELDS: (keyof Koi)[] = ['name', 'nameJa', 'description', 'group']

export function CatalogPage() {
  const { kois, removeKoi, resetToInitial } = useKoiCatalog()
  const toast = useToast()
  const [query, setQuery] = useState('')
  const [group, setGroup] = useState('all')
  const [selected, setSelected] = useState<Koi | null>(null)
  const [editing, setEditing] = useState<Koi | null>(null)
  const [showStarter, setShowStarter] = useState(false)

  const groups = useMemo(() => {
    const g = new Set<string>(kois.map((k) => k.group))
    return ['all', ...[...g].sort()]
  }, [kois])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return kois.filter((k) => {
      if (group !== 'all' && k.group !== group) return false
      if (!q) return true
      return SEARCHABLE_FIELDS.some((f) => String(k[f] ?? '').toLowerCase().includes(q))
    })
  }, [kois, query, group])

  function handleDelete(k: Koi) {
    if (window.confirm(`Excluir "${k.name}" do catálogo?`)) {
      void removeKoi(k.id)
      setSelected(null)
      toast.show(`"${k.name}" removido.`)
    }
  }

  function handleReset() {
    if (window.confirm('Restaurar o catálogo inicial (as 12 variedades originais)? Isso apaga as adições e remoções.')) {
      void resetToInitial()
      toast.show('Catálogo restaurado.')
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-white">Catálogo de Kois</h1>
          <p className="mt-1 text-sm text-slate-400">
            {kois.length} variedade{kois.length !== 1 ? 's' : ''} · clique para detalhes
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setShowStarter(true)}
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-300 transition hover:bg-white/10"
          >
            Restaurar inicial
          </button>
        </div>
      </div>

      <div className="mb-6 flex flex-wrap gap-3">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por nome, descrição…"
          className="min-w-0 flex-1 rounded-lg border border-white/10 bg-slate-900 px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-cyan-500/50"
        />
        <select
          value={group}
          onChange={(e) => setGroup(e.target.value)}
          className="rounded-lg border border-white/10 bg-slate-900 px-3 py-2.5 text-sm text-white outline-none focus:border-cyan-500/50"
        >
          {groups.map((g) => (
            <option key={g} value={g}>
              {g === 'all' ? 'Todos os grupos' : g}
            </option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/10 py-16 text-center text-slate-400">
          {kois.length === 0
            ? 'Nenhuma variedade ainda. Adicione a primeira pelo menu "Nova".'
            : 'Nada encontrado para essa busca.'}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((k) => (
            <KoiCard key={k.id} koi={k} onClick={() => setSelected(k)} />
          ))}
        </div>
      )}

      {selected && (
        <KoiDetailsModal
          koi={selected}
          onClose={() => setSelected(null)}
          onEdit={() => {
            setEditing(selected)
            setSelected(null)
          }}
          onDelete={() => handleDelete(selected)}
        />
      )}

      {editing && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          onClick={() => setEditing(null)}
        >
          <div
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-white/10 bg-slate-900 p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Editar variedade</h3>
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="rounded-full bg-black/40 p-1.5 text-slate-400 transition hover:bg-black/60 hover:text-white"
                aria-label="Fechar"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
            <KoiForm
              key={editing.id}
              initial={editing}
              onCancel={() => setEditing(null)}
              onSaved={() => setEditing(null)}
            />
          </div>
        </div>
      )}

      {showStarter && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" onClick={() => setShowStarter(false)}>
          <div
            className="w-full max-w-md rounded-2xl border border-white/10 bg-slate-900 p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-white">Restaurar catálogo inicial</h3>
            <p className="mt-2 text-sm text-slate-400">
              Isso vai apagar todas as variedades adicionadas e remoções, voltando às 12 originais.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowStarter(false)}
                className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300 transition hover:bg-white/10"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  handleReset()
                  setShowStarter(false)
                }}
                className="rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-400"
              >
                Restaurar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}