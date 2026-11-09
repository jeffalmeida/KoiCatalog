import type { Koi } from '../types'

interface KoiCardProps {
  koi: Koi
  onClick?: () => void
  compact?: boolean
}

const GROUP_COLORS: Record<string, string> = {
  Gosanke: 'bg-rose-500/10 text-rose-300 border-rose-500/30',
  Utsurimono: 'bg-slate-500/10 text-slate-300 border-slate-500/30',
  Hikarimono: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
  Kawarimono: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
  Doitsu: 'bg-sky-500/10 text-sky-300 border-sky-500/30',
}

export function KoiCard({ koi, onClick, compact }: KoiCardProps) {
  const groupClass = GROUP_COLORS[koi.group] ?? 'bg-slate-500/10 text-slate-300 border-slate-500/30'

  return (
    <button
      type="button"
      onClick={onClick}
      className={
        'group relative flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-slate-900 text-left transition hover:-translate-y-0.5 hover:border-white/20 hover:shadow-lg hover:shadow-black/40 ' +
        (compact ? '' : '')
      }
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden">
        <img
          src={koi.image}
          alt={koi.name}
          loading="lazy"
          className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
        <span
          className={
            'absolute top-2 right-2 rounded-full border px-2 py-0.5 text-xs font-medium backdrop-blur ' +
            groupClass
          }
        >
          {koi.group}
        </span>
      </div>
      <div className="flex flex-col gap-1 p-3">
        <div className="flex items-baseline gap-2">
          <h3 className="text-base font-semibold text-white">{koi.name}</h3>
          {koi.nameJa && <span className="text-xs text-slate-500">{koi.nameJa}</span>}
        </div>
        {!compact && (
          <p className="line-clamp-2 text-sm text-slate-400">{koi.description}</p>
        )}
        <div className="mt-1 flex flex-wrap gap-1">
          {koi.colors.map((c) => (
            <span key={c} className="rounded-full bg-white/5 px-2 py-0.5 text-xs text-slate-300">
              {c}
            </span>
          ))}
        </div>
      </div>
    </button>
  )
}