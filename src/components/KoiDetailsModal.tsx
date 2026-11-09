import type { Koi } from '../types'

interface KoiDetailsModalProps {
  koi: Koi
  onClose: () => void
  onEdit?: () => void
  onStudy?: () => void
  onDelete?: () => void
}

export function KoiDetailsModal({ koi, onClose, onEdit, onStudy, onDelete }: KoiDetailsModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-white/10 bg-slate-900 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative">
          <img src={koi.image} alt={koi.name} className="aspect-[4/3] w-full object-cover" />
          <button
            type="button"
            onClick={onClose}
            className="absolute top-3 right-3 rounded-full bg-black/60 p-2 text-white backdrop-blur transition hover:bg-black/80"
            aria-label="Fechar"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-5">
          <div className="flex items-baseline gap-2">
            <h2 className="text-2xl font-bold text-white">{koi.name}</h2>
            {koi.nameJa && <span className="text-sm text-slate-500">{koi.nameJa}</span>}
          </div>
          <span className="mt-1 inline-block rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-xs text-slate-300">
            {koi.group}
          </span>
          <p className="mt-3 text-sm leading-relaxed text-slate-300">{koi.description}</p>
          {koi.colors.length > 0 && (
            <div className="mt-4">
              <h4 className="text-xs font-medium tracking-wide text-slate-500 uppercase">Cores</h4>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {koi.colors.map((c) => (
                  <span key={c} className="rounded-full bg-white/5 px-2.5 py-0.5 text-xs text-slate-200">
                    {c}
                  </span>
                ))}
              </div>
            </div>
          )}
          <div className="mt-5 flex gap-2">
            {onEdit && (
              <button
                type="button"
                onClick={onEdit}
                className="flex-1 rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-slate-200 transition hover:bg-white/10"
              >
                Editar
              </button>
            )}
            {onStudy && (
              <button
                type="button"
                onClick={onStudy}
                className="flex-1 rounded-lg bg-cyan-500 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400"
              >
                Estudar este koi
              </button>
            )}
            {onDelete && (
              <button
                type="button"
                onClick={onDelete}
                className="flex-1 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-2.5 text-sm font-semibold text-red-300 transition hover:bg-red-500/20"
              >
                Excluir
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}