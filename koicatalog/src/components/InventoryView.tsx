import { useState } from 'react'
import { useCatalog } from '../catalog.ts'
import { navigate } from '../route.ts'
import { primaryButtonClass, textButtonClass } from '../styles.ts'
import { colorsFollowPattern, speciesPattern } from '../speciesPatterns.ts'
import { countLabel, errorText, findByName, fishPaint, speciesName } from '../text.ts'
import type { Fish } from '../types.ts'
import { KoiSvg } from './KoiSvg.tsx'

export function InventoryView() {
  const { mode, fish, colors, species, reload } = useCatalog()
  const [refreshing, setRefreshing] = useState(false)
  const [refreshError, setRefreshError] = useState<string | null>(null)
  const branco = findByName(colors, 'Branco')
  const vermelho = findByName(colors, 'Vermelho')

  async function refresh() {
    setRefreshing(true)
    setRefreshError(null)
    try {
      await reload()
    } catch (error) {
      setRefreshError(errorText(error, 'Não foi possível abrir o inventário.'))
    } finally {
      setRefreshing(false)
    }
  }

  return (
    <div>
      <header className="mb-5 flex items-end justify-between gap-3">
        <div>
          <p className="text-sm tracking-[0.16em] text-muted uppercase">Inventário</p>
          <h1 className="mt-1 font-display text-5xl leading-none text-pond">{countLabel(fish.length)}</h1>
        </div>
        <div className="flex flex-col items-end">
          <button type="button" className={textButtonClass} onClick={() => navigate('#/settings')}>
            Ajustes
          </button>
          {mode === 'supabase' ? (
            <button type="button" className={textButtonClass} disabled={refreshing} onClick={() => void refresh()}>
              {refreshing ? 'Atualizando…' : 'Atualizar'}
            </button>
          ) : null}
        </div>
      </header>
      {refreshError ? (
        <p className="mb-3 text-sm text-danger" role="alert">
          {refreshError}
        </p>
      ) : null}
      <button type="button" className={primaryButtonClass} onClick={() => navigate('#/new')}>
        Nova carpa
      </button>
      {fish.length === 0 ? (
        <div className="mt-8">
          <KoiSvg
            decorative
            motif="Kohaku"
            bodyColor={branco?.hex ?? '#f3efe6'}
            headColor={vermelho?.hex ?? '#d12d2a'}
            dorsalColor={vermelho?.hex ?? '#d12d2a'}
            className="mx-auto !h-64 !w-auto"
          />
          <p className="mt-4 text-center text-muted">Quando uma passar, toque em Nova carpa.</p>
        </div>
      ) : (
        <ul className="mt-5 space-y-3" aria-label="Carpas cadastradas">
          {fish.map((item) => (
            <FishCard key={item.id} fish={item} colors={colors} speciesLabel={speciesName(species, item.speciesId)} />
          ))}
        </ul>
      )}
    </div>
  )
}

function FishCard({
  fish,
  colors,
  speciesLabel,
}: {
  fish: Fish
  colors: ReturnType<typeof useCatalog>['colors']
  speciesLabel: string
}) {
  const { deleteFish } = useCatalog()
  const [confirming, setConfirming] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const paint = fishPaint(colors, fish)
  const pattern = speciesPattern(speciesLabel)
  const motif =
    pattern && colorsFollowPattern(colors, pattern, fish.bodyColorId, fish.headColorId, fish.dorsalColorId)
      ? speciesLabel
      : null
  const label = fish.nickname.trim() || 'Sem apelido'

  async function remove() {
    setBusy(true)
    setError(null)
    try {
      await deleteFish(fish.id)
    } catch (caught) {
      setBusy(false)
      setConfirming(false)
      setError(errorText(caught, 'Não foi possível excluir. Tente de novo.'))
    }
  }

  return (
    <li className="rounded-3xl border border-line bg-card p-3 shadow-[0_8px_24px_rgba(20,52,60,0.06)]">
      <button
        type="button"
        className="flex w-full items-center gap-3 text-left"
        aria-label={`Editar ${label}`}
        onClick={() => navigate(`#/fish/${fish.id}`)}
      >
        <KoiSvg
          decorative
          motif={motif ?? undefined}
          bodyColor={paint.body}
          headColor={paint.head}
          dorsalColor={paint.dorsal}
          className="!h-36 !w-auto shrink-0"
        />
        <span className="min-w-0 flex-1">
          <span className="block truncate font-medium">{label}</span>
          <span className="mt-1 block text-sm text-muted">{speciesLabel}</span>
        </span>
      </button>
      {confirming ? (
        <div className="mt-2 flex items-center justify-between gap-2">
          <p className="text-sm">Excluir esta carpa?</p>
          <button type="button" className="min-h-12 rounded-2xl px-3" disabled={busy} onClick={() => setConfirming(false)}>
            Não
          </button>
          <button
            type="button"
            className="min-h-12 rounded-2xl bg-koi px-4 text-white disabled:opacity-50"
            disabled={busy}
            onClick={() => void remove()}
          >
            Sim
          </button>
        </div>
      ) : (
        <button type="button" className="mt-1 min-h-12 px-2 text-sm text-koi" onClick={() => setConfirming(true)}>
          Excluir
        </button>
      )}
      {error ? (
        <p className="text-sm text-danger" role="alert">
          {error}
        </p>
      ) : null}
    </li>
  )
}
