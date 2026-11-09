import { useRef, useState, type FormEvent } from 'react'
import { useCatalog } from '../catalog.ts'
import { navigate } from '../route.ts'
import { colorsFollowPattern, previewPaint, speciesPattern } from '../speciesPatterns.ts'
import { fieldClass, primaryButtonClass } from '../styles.ts'
import { errorText, findByName, fishPaint, patternSummary, REGION_LABEL } from '../text.ts'
import type { Region, Species } from '../types.ts'
import { BackButton } from './BackButton.tsx'
import { KoiSvg } from './KoiSvg.tsx'

const REGIONS: Array<{ id: Region; short: string }> = [
  { id: 'body', short: 'Predominante' },
  { id: 'head', short: 'Cabeça' },
  { id: 'dorsal', short: 'Dorsal' },
]

export function FishForm({ fishId }: { fishId?: string }) {
  const { colors, species, fish, saveFish } = useCatalog()
  const existing = fishId ? fish.find((item) => item.id === fishId) : undefined
  const fallbackBody = colors.find((color) => color.body)?.id ?? ''
  const [nickname, setNickname] = useState(existing?.nickname ?? '')
  const [speciesId, setSpeciesId] = useState<string | null>(existing?.speciesId ?? null)
  const [bodyColorId, setBodyColorId] = useState(existing?.bodyColorId ?? fallbackBody)
  const [headColorId, setHeadColorId] = useState<string | null>(existing?.headColorId ?? null)
  const [dorsalColorId, setDorsalColorId] = useState<string | null>(existing?.dorsalColorId ?? null)
  const [active, setActive] = useState<Region>('body')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [presetError, setPresetError] = useState<string | null>(null)
  const saveRef = useRef<HTMLButtonElement>(null)

  if (fishId && !existing) {
    return (
      <div>
        <BackButton />
        <p className="mt-6 font-display text-3xl text-pond">Carpa não encontrada.</p>
      </div>
    )
  }

  const paint = fishPaint(colors, { bodyColorId, headColorId, dorsalColorId })
  const chosen = species.find((item) => item.id === speciesId) ?? null
  const chosenPattern = chosen ? speciesPattern(chosen.name) : null
  const motif =
    chosen && chosenPattern && colorsFollowPattern(colors, chosenPattern, bodyColorId, headColorId, dorsalColorId)
      ? chosen.name
      : null
  const selectedId = active === 'body' ? bodyColorId : active === 'head' ? headColorId : dorsalColorId
  const palette = colors.filter((color) => color[active] || color.id === selectedId)

  function choose(colorId: string | null) {
    setPresetError(null)
    if (active === 'body') {
      if (colorId) setBodyColorId(colorId)
      return
    }
    if (active === 'head') setHeadColorId(colorId)
    else setDorsalColorId(colorId)
  }

  function revealSave() {
    window.setTimeout(() => {
      saveRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
    }, 50)
  }

  function applySpecies(item: Species) {
    const pattern = speciesPattern(item.name)
    if (!pattern) {
      setSpeciesId(item.id)
      setPresetError(null)
      revealSave()
      return
    }
    const missing: string[] = []
    const resolve = (name: string | null) => {
      if (!name) return null
      const color = findByName(colors, name)
      if (!color) missing.push(name)
      return color ?? null
    }
    const body = resolve(pattern.body)
    const head = resolve(pattern.head)
    const dorsal = resolve(pattern.dorsal)
    if (missing.length > 0 || !body) {
      const list = missing.join(', ')
      setPresetError(
        missing.length === 1
          ? `Esta espécie usa a cor ${list}. Crie ou renomeie essa cor nos ajustes.`
          : `Esta espécie usa as cores ${list}. Crie ou renomeie essas cores nos ajustes.`,
      )
      return
    }
    setBodyColorId(body.id)
    setHeadColorId(head?.id ?? null)
    setDorsalColorId(dorsal?.id ?? null)
    setSpeciesId(item.id)
    setActive('body')
    setPresetError(null)
    revealSave()
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    if (!bodyColorId || saving) return
    setSaving(true)
    setError(null)
    try {
      await saveFish({
        id: existing?.id,
        nickname,
        speciesId,
        bodyColorId,
        headColorId,
        dorsalColorId,
      })
      navigate('#/')
    } catch (caught) {
      setSaving(false)
      setError(errorText(caught, 'Não foi possível salvar. Tente de novo.'))
    }
  }

  return (
    <form onSubmit={(event) => void onSubmit(event)}>
      <div className="mb-2 flex items-center gap-2">
        <BackButton />
        <h1 className="font-display text-3xl text-pond">{existing ? 'Editar carpa' : 'Nova carpa'}</h1>
      </div>
      <KoiSvg
        bodyColor={paint.body}
        headColor={paint.head}
        dorsalColor={paint.dorsal}
        motif={motif}
        selected={active}
        onSelect={setActive}
        className="mx-auto !h-80 !w-auto"
      />
      <p className="mt-2 text-sm text-muted" aria-live="polite">
        {patternSummary(colors, { bodyColorId, headColorId, dorsalColorId })}
      </p>
      <p className="mt-5 text-sm text-muted">Toque a região e escolha a cor.</p>
      <div className="mt-2 grid grid-cols-3 gap-2">
        {REGIONS.map((region) => (
          <button
            key={region.id}
            type="button"
            aria-pressed={active === region.id}
            className={`min-h-14 rounded-2xl border px-2 text-sm ${
              active === region.id ? 'border-pond bg-pond text-white' : 'border-line bg-card text-ink'
            }`}
            onClick={() => setActive(region.id)}
          >
            {region.short}
          </button>
        ))}
      </div>
      <p className="mt-4 text-sm font-medium">{REGION_LABEL[active]}</p>
      <div className="mt-2 grid grid-cols-4 gap-2">
        {palette.map((color) => (
          <button
            key={color.id}
            type="button"
            aria-pressed={selectedId === color.id}
            aria-label={color.name}
            className={`flex min-h-16 flex-col items-center justify-center gap-1 rounded-2xl border bg-card px-1 ${
              selectedId === color.id ? 'border-pond ring-2 ring-pond' : 'border-line'
            }`}
            onClick={() => choose(color.id)}
          >
            <span className="size-8 rounded-full border border-black/10" style={{ backgroundColor: color.hex }} />
            <span className="text-center text-xs leading-tight">{color.name}</span>
          </button>
        ))}
        {active !== 'body' ? (
          <button
            type="button"
            aria-pressed={selectedId === null}
            className={`flex min-h-16 flex-col items-center justify-center gap-1 rounded-2xl border bg-card px-1 text-xs ${
              selectedId === null ? 'border-pond ring-2 ring-pond' : 'border-line'
            }`}
            onClick={() => choose(null)}
          >
            <span className="grid size-8 place-items-center rounded-full border border-line text-muted">—</span>
            Nenhuma
          </button>
        ) : null}
      </div>
      {palette.length === 0 ? (
        <p className="mt-2 text-sm text-danger">Nenhuma cor disponível para esta região. Adicione uma nos ajustes.</p>
      ) : null}
      <p className="mt-6 text-sm font-medium">Espécie</p>
      <p className="mt-1 text-sm text-muted">Toque a foto. As cores entram no desenho.</p>
      <div className="mt-3 grid grid-cols-2 gap-3">
        {species.map((item) => {
          const preview = previewPaint(colors, item.name)
          const selected = speciesId === item.id
          return (
            <button
              key={item.id}
              type="button"
              aria-pressed={selected}
              className={`rounded-3xl border bg-card p-2 ${selected ? 'border-pond ring-2 ring-pond' : 'border-line'}`}
              onClick={() => applySpecies(item)}
            >
              <KoiSvg
                decorative
                motif={item.name}
                bodyColor={preview.body}
                headColor={preview.head}
                dorsalColor={preview.dorsal}
                className="mx-auto !h-36 !w-auto"
              />
              <span className="mt-1 block text-center text-xs font-medium leading-tight">{item.name}</span>
            </button>
          )
        })}
      </div>
      {presetError ? (
        <p className="mt-2 text-sm text-danger" role="status">
          {presetError}
        </p>
      ) : null}
      <label className="mt-6 block text-sm font-medium" htmlFor="nickname">
        Apelido
      </label>
      <input
        id="nickname"
        className={`${fieldClass} mt-2`}
        value={nickname}
        maxLength={60}
        autoComplete="off"
        enterKeyHint="done"
        placeholder="Ex.: a laranja grande"
        onChange={(event) => setNickname(event.target.value)}
      />
      {error ? (
        <p className="mt-4 text-sm text-danger" role="alert">
          {error}
        </p>
      ) : null}
      <button ref={saveRef} type="submit" className={`${primaryButtonClass} mt-4`} disabled={saving || !bodyColorId}>
        {saving ? 'Salvando…' : 'Salvar'}
      </button>
    </form>
  )
}
