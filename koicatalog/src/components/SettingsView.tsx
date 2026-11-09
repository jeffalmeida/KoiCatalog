import { useRef, useState } from 'react'
import { useCatalog } from '../catalog.ts'
import { fieldClass, primaryButtonClass, secondaryButtonClass } from '../styles.ts'
import { colorInUse, errorText, speciesInUse } from '../text.ts'
import type { KoiColor, Region, Species } from '../types.ts'
import { BackButton } from './BackButton.tsx'

const ROLES: Array<{ id: Region; label: string }> = [
  { id: 'body', label: 'Corpo' },
  { id: 'head', label: 'Cabeça' },
  { id: 'dorsal', label: 'Dorsal' },
]

export function SettingsView() {
  const catalog = useCatalog()
  const bodyCount = catalog.colors.filter((color) => color.body).length

  return (
    <div>
      <div className="mb-6 flex items-center gap-2">
        <BackButton />
        <h1 className="font-display text-3xl text-pond">Ajustes</h1>
      </div>

      <section>
        <h2 className="font-display text-2xl text-pond">Cores</h2>
        <p className="mt-1 text-sm text-muted">
          Cada cor pode valer para o corpo, a mancha da cabeça e a mancha dorsal.
        </p>
        <ul className="mt-4 space-y-3">
          {catalog.colors.map((color) => (
            <ColorEditor
              key={color.id}
              color={color}
              used={colorInUse(catalog.fish, color.id)}
              onlyBody={color.body && bodyCount <= 1}
            />
          ))}
        </ul>
        <AddColor />
      </section>

      <section className="mt-10">
        <h2 className="font-display text-2xl text-pond">Espécies</h2>
        <ul className="mt-4 space-y-3">
          {catalog.species.map((item) => (
            <SpeciesEditor key={item.id} species={item} used={speciesInUse(catalog.fish, item.id)} />
          ))}
        </ul>
        <AddSpecies />
      </section>

      <AccountSection />
    </div>
  )
}

function ColorEditor({ color, used, onlyBody }: { color: KoiColor; used: boolean; onlyBody: boolean }) {
  const { saveColor, deleteColor } = useCatalog()
  const [draft, setDraft] = useState(color)
  const draftRef = useRef(color)
  const savedRef = useRef(color)
  const queue = useRef<Promise<void>>(Promise.resolve())
  const [error, setError] = useState<string | null>(null)
  const [confirming, setConfirming] = useState(false)

  function commit(patch: Partial<KoiColor>, onlyIfChanged = false) {
    const next: KoiColor = { ...draftRef.current, ...patch }
    if (patch.name !== undefined) next.name = patch.name.trim()
    if (!next.name) {
      const restored = { ...draftRef.current, name: savedRef.current.name }
      draftRef.current = restored
      setDraft(restored)
      setError('Dê um nome à cor.')
      return
    }
    if (!next.body && !next.head && !next.dorsal) {
      setError('Cada cor precisa servir para pelo menos uma região.')
      return
    }
    if (patch.body === false && onlyBody) {
      setError('Mantenha pelo menos uma cor de corpo.')
      return
    }
    const same =
      next.name === savedRef.current.name &&
      next.hex === savedRef.current.hex &&
      next.body === savedRef.current.body &&
      next.head === savedRef.current.head &&
      next.dorsal === savedRef.current.dorsal
    draftRef.current = next
    setDraft(next)
    if (onlyIfChanged && same) return

    const task = queue.current.then(async () => {
      try {
        await saveColor(draftRef.current)
        savedRef.current = { ...draftRef.current }
        setError(null)
      } catch (caught) {
        setError(errorText(caught, 'Não foi possível salvar. Tente de novo.'))
      }
    })
    queue.current = task.then(
      () => undefined,
      () => undefined,
    )
  }

  async function remove() {
    try {
      await deleteColor(color.id)
    } catch (caught) {
      setConfirming(false)
      setError(errorText(caught, 'Não foi possível excluir. Tente de novo.'))
    }
  }

  return (
    <li className="rounded-3xl border border-line bg-card p-3">
      <div className="flex items-center gap-3">
        <label className="relative size-14 shrink-0 overflow-hidden rounded-2xl border border-line">
          <span className="absolute inset-0" style={{ backgroundColor: draft.hex }} />
          <input
            type="color"
            value={draft.hex}
            aria-label={`Amostra de ${draft.name}`}
            className="absolute inset-0 cursor-pointer opacity-0"
            onChange={(event) => commit({ hex: event.target.value })}
          />
        </label>
        <input
          className={fieldClass}
          value={draft.name}
          maxLength={40}
          aria-label={`Nome da cor ${color.name}`}
          onChange={(event) => {
            const next = { ...draftRef.current, name: event.target.value }
            draftRef.current = next
            setDraft(next)
          }}
          onBlur={() => commit({ name: draftRef.current.name }, true)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') event.currentTarget.blur()
          }}
        />
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2">
        {ROLES.map((role) => (
          <button
            key={role.id}
            type="button"
            aria-pressed={draft[role.id]}
            aria-label={`${draft.name}: ${role.label}`}
            className={`min-h-12 rounded-2xl border text-sm ${
              draft[role.id] ? 'border-pond bg-pond text-white' : 'border-line bg-paper'
            }`}
            onClick={() => commit({ [role.id]: !draftRef.current[role.id] })}
          >
            {role.label}
          </button>
        ))}
      </div>
      <div className="mt-3 flex justify-end">
        {used ? (
          <span className="text-sm text-muted">Em uso</span>
        ) : onlyBody ? (
          <span className="text-sm text-muted">Obrigatória</span>
        ) : confirming ? (
          <span className="flex gap-2">
            <button type="button" className="min-h-12 px-3" onClick={() => setConfirming(false)}>
              Cancelar
            </button>
            <button type="button" className="min-h-12 rounded-2xl bg-koi px-4 text-white" onClick={() => void remove()}>
              Confirmar
            </button>
          </span>
        ) : (
          <button type="button" className="min-h-12 px-3 text-sm text-koi" onClick={() => setConfirming(true)}>
            Remover
          </button>
        )}
      </div>
      {error ? (
        <p className="mt-1 text-sm text-danger" role="alert">
          {error}
        </p>
      ) : null}
    </li>
  )
}

function AddColor() {
  const { colors, saveColor } = useCatalog()
  const [name, setName] = useState('')
  const [hex, setHex] = useState('#d4532b')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function add() {
    const trimmed = name.trim()
    if (!trimmed) {
      setError('Dê um nome à cor.')
      return
    }
    setBusy(true)
    setError(null)
    try {
      const sort = colors.reduce((max, color) => Math.max(max, color.sort), -1) + 1
      await saveColor({
        id: crypto.randomUUID(),
        name: trimmed,
        hex,
        body: true,
        head: true,
        dorsal: true,
        sort,
      })
      setName('')
      setHex('#d4532b')
    } catch (caught) {
      setError(errorText(caught, 'Não foi possível salvar. Tente de novo.'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mt-3 rounded-3xl border border-dashed border-line bg-card p-3">
      <p className="text-sm font-medium">Nova cor</p>
      <div className="mt-3 flex items-center gap-3">
        <label className="relative size-14 shrink-0 overflow-hidden rounded-2xl border border-line">
          <span className="absolute inset-0" style={{ backgroundColor: hex }} />
          <input
            type="color"
            value={hex}
            aria-label="Amostra da nova cor"
            className="absolute inset-0 cursor-pointer opacity-0"
            onChange={(event) => setHex(event.target.value)}
          />
        </label>
        <input
          className={fieldClass}
          value={name}
          maxLength={40}
          placeholder="Ex.: Rosa"
          aria-label="Nome da nova cor"
          onChange={(event) => setName(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault()
              void add()
            }
          }}
        />
      </div>
      {error ? (
        <p className="mt-2 text-sm text-danger" role="alert">
          {error}
        </p>
      ) : null}
      <button type="button" className={`${secondaryButtonClass} mt-3 w-full`} disabled={busy} onClick={() => void add()}>
        Adicionar cor
      </button>
    </div>
  )
}

function SpeciesEditor({ species, used }: { species: Species; used: boolean }) {
  const { saveSpecies, deleteSpecies } = useCatalog()
  const [name, setName] = useState(species.name)
  const [error, setError] = useState<string | null>(null)
  const [confirming, setConfirming] = useState(false)

  async function commit() {
    const next = name.trim()
    if (!next) {
      setName(species.name)
      setError('Dê um nome à espécie.')
      return
    }
    if (next === species.name) return
    try {
      await saveSpecies({ ...species, name: next })
      setError(null)
    } catch (caught) {
      setError(errorText(caught, 'Não foi possível salvar. Tente de novo.'))
    }
  }

  async function remove() {
    try {
      await deleteSpecies(species.id)
    } catch (caught) {
      setConfirming(false)
      setError(errorText(caught, 'Não foi possível excluir. Tente de novo.'))
    }
  }

  return (
    <li className="rounded-3xl border border-line bg-card p-3">
      <div className="flex items-center gap-2">
        <input
          className={fieldClass}
          value={name}
          maxLength={40}
          aria-label={`Espécie ${species.name}`}
          onChange={(event) => setName(event.target.value)}
          onBlur={() => void commit()}
          onKeyDown={(event) => {
            if (event.key === 'Enter') event.currentTarget.blur()
          }}
        />
      </div>
      <div className="mt-2 flex justify-end">
        {used ? (
          <span className="text-sm text-muted">Em uso</span>
        ) : confirming ? (
          <span className="flex gap-2">
            <button type="button" className="min-h-12 px-3" onClick={() => setConfirming(false)}>
              Cancelar
            </button>
            <button type="button" className="min-h-12 rounded-2xl bg-koi px-4 text-white" onClick={() => void remove()}>
              Confirmar
            </button>
          </span>
        ) : (
          <button type="button" className="min-h-12 px-3 text-sm text-koi" onClick={() => setConfirming(true)}>
            Remover
          </button>
        )}
      </div>
      {error ? (
        <p className="text-sm text-danger" role="alert">
          {error}
        </p>
      ) : null}
    </li>
  )
}

function AddSpecies() {
  const { species, saveSpecies } = useCatalog()
  const [name, setName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function add() {
    const trimmed = name.trim()
    if (!trimmed) {
      setError('Dê um nome à espécie.')
      return
    }
    setBusy(true)
    setError(null)
    try {
      const sort = species.reduce((max, item) => Math.max(max, item.sort), -1) + 1
      await saveSpecies({ id: crypto.randomUUID(), name: trimmed, sort })
      setName('')
    } catch (caught) {
      setError(errorText(caught, 'Não foi possível salvar. Tente de novo.'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mt-3 rounded-3xl border border-dashed border-line bg-card p-3">
      <p className="text-sm font-medium">Nova espécie</p>
      <input
        className={`${fieldClass} mt-3`}
        value={name}
        maxLength={40}
        placeholder="Ex.: Karasu"
        aria-label="Nome da nova espécie"
        onChange={(event) => setName(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.preventDefault()
            void add()
          }
        }}
      />
      {error ? (
        <p className="mt-2 text-sm text-danger" role="alert">
          {error}
        </p>
      ) : null}
      <button type="button" className={`${secondaryButtonClass} mt-3 w-full`} disabled={busy} onClick={() => void add()}>
        Adicionar espécie
      </button>
    </div>
  )
}

function AccountSection() {
  const { mode, email, signOut } = useCatalog()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function exit() {
    setBusy(true)
    setError(null)
    try {
      await signOut()
    } catch (caught) {
      setBusy(false)
      setError(errorText(caught, 'Não foi possível sair. Tente de novo.'))
    }
  }

  return (
    <section className="mt-10">
      {mode === 'supabase' ? (
        <>
          <h2 className="font-display text-2xl text-pond">Conta</h2>
          <p className="mt-2 text-sm text-muted">{email}</p>
          {error ? (
            <p className="mt-2 text-sm text-danger" role="alert">
              {error}
            </p>
          ) : null}
          <button type="button" className={`${primaryButtonClass} mt-4`} disabled={busy} onClick={() => void exit()}>
            {busy ? 'Saindo…' : 'Sair'}
          </button>
        </>
      ) : (
        <>
          <h2 className="font-display text-2xl text-pond">Neste navegador</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            Os dados ficam só neste navegador. Para abrir o mesmo inventário no celular e no computador, preencha o
            arquivo .env com as chaves do Supabase.
          </p>
        </>
      )}
    </section>
  )
}
