import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { CatalogContext } from './catalog.ts'
import { supabase } from './lib/supabase.ts'
import { createRepository, loadCatalog, resetCatalogCache } from './repository.ts'
import { StatusScreen } from './StatusScreen.tsx'
import { errorText, sortByOrder } from './text.ts'
import type { Fish, FishDraft, KoiColor, Species } from './types.ts'

function upsert<T extends { id: string }>(items: T[], item: T): T[] {
  return items.some((current) => current.id === item.id)
    ? items.map((current) => (current.id === item.id ? item : current))
    : [...items, item]
}

export function CatalogProvider({ email, children }: { email: string | null; children: ReactNode }) {
  const repo = useMemo(() => createRepository(), [])
  const [colors, setColors] = useState<KoiColor[]>([])
  const [species, setSpecies] = useState<Species[]>([])
  const [fish, setFish] = useState<Fish[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const apply = useCallback((snap: { colors: KoiColor[]; species: Species[]; fish: Fish[] }) => {
    setColors(snap.colors)
    setSpecies(snap.species)
    setFish(snap.fish)
  }, [])

  useEffect(() => {
    let active = true
    void loadCatalog(repo)
      .then((snap) => {
        if (!active) return
        apply(snap)
        setLoading(false)
      })
      .catch((error: unknown) => {
        if (!active) return
        setLoadError(errorText(error, 'Não foi possível abrir o inventário.'))
        setLoading(false)
      })
    return () => {
      active = false
    }
  }, [apply, repo])

  const reload = useCallback(async () => {
    resetCatalogCache()
    const snap = await loadCatalog(repo)
    apply(snap)
  }, [apply, repo])

  const saveFish = useCallback(
    async (draft: FishDraft) => {
      const saved = await repo.saveFish(draft)
      setFish((current) => {
        const exists = current.some((item) => item.id === saved.id)
        if (!exists) return [saved, ...current]
        return current.map((item) => (item.id === saved.id ? saved : item))
      })
    },
    [repo],
  )

  const deleteFish = useCallback(
    async (id: string) => {
      await repo.deleteFish(id)
      setFish((current) => current.filter((item) => item.id !== id))
    },
    [repo],
  )

  const saveColor = useCallback(
    async (color: KoiColor) => {
      const saved = await repo.saveColor(color)
      setColors((current) => sortByOrder(upsert(current, saved)))
    },
    [repo],
  )

  const deleteColor = useCallback(
    async (id: string) => {
      await repo.deleteColor(id)
      setColors((current) => current.filter((item) => item.id !== id))
    },
    [repo],
  )

  const saveSpecies = useCallback(
    async (item: Species) => {
      const saved = await repo.saveSpecies(item)
      setSpecies((current) => sortByOrder(upsert(current, saved)))
    },
    [repo],
  )

  const deleteSpecies = useCallback(
    async (id: string) => {
      await repo.deleteSpecies(id)
      setSpecies((current) => current.filter((item) => item.id !== id))
    },
    [repo],
  )

  const signOut = useCallback(async () => {
    resetCatalogCache()
    if (!supabase) return
    const { error } = await supabase.auth.signOut()
    if (error) throw new Error('Não foi possível sair. Tente de novo.')
  }, [])

  if (loading) return <StatusScreen title="Abrindo o inventário…" />
  if (loadError) {
    return (
      <StatusScreen
        title={loadError}
        action={{
          label: 'Tentar de novo',
          onClick: () => {
            setLoading(true)
            setLoadError(null)
            void reload()
              .then(() => setLoading(false))
              .catch((error: unknown) => {
                setLoadError(errorText(error, 'Não foi possível abrir o inventário.'))
                setLoading(false)
              })
          },
        }}
      />
    )
  }

  return (
    <CatalogContext.Provider
      value={{
        mode: repo.mode,
        email,
        colors,
        species,
        fish,
        reload,
        saveFish,
        deleteFish,
        saveColor,
        deleteColor,
        saveSpecies,
        deleteSpecies,
        signOut,
      }}
    >
      {children}
    </CatalogContext.Provider>
  )
}
