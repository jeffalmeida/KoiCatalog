import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { Koi } from '../types'
import { initialKois } from '../data/kois'
import type { AddKoiInput, UpdateKoiInput } from './useKoiCatalog'
import { KoiCatalogError, DEFAULT_IMAGE, slugify } from './useKoiCatalog'

const STORAGE_KEY = 'koi-catalog-v1'

function loadLocalFallback(): Koi[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed) && parsed.length > 0) return parsed
    }
  } catch {
    // corrompido -> inicial
  }
  return initialKois
}

export interface KoiCatalogContextValue {
  kois: Koi[]
  loading: boolean
  usingApi: boolean
  getKoi: (id: string) => Koi | undefined
  findByImage: (image: string) => boolean
  addKoi: (input: AddKoiInput) => Promise<Koi>
  updateKoi: (id: string, input: UpdateKoiInput) => Promise<Koi>
  uploadImage: (file: File) => Promise<string>
  removeKoi: (id: string) => Promise<void>
  resetToInitial: () => Promise<void>
}

const KoiCatalogContext = createContext<KoiCatalogContextValue | null>(null)

export function KoiCatalogProvider({ children }: { children: ReactNode }) {
  const [kois, setKois] = useState<Koi[]>(initialKois)
  const [loading, setLoading] = useState(true)
  const [usingApi, setUsingApi] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const res = await fetch('/api/kois')
        if (!res.ok) throw new Error(`status ${res.status}`)
        const data = await res.json()
        if (!cancelled && Array.isArray(data.kois) && data.kois.length > 0) {
          setKois(data.kois)
          setUsingApi(true)
        }
      } catch {
        if (!cancelled) {
          setKois(loadLocalFallback())
          setUsingApi(false)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [])

  async function loadFromApi() {
    try {
      const res = await fetch('/api/kois')
      if (!res.ok) throw new Error(`status ${res.status}`)
      const data = await res.json()
      if (Array.isArray(data.kois) && data.kois.length > 0) {
        setKois(data.kois)
        setUsingApi(true)
      }
    } catch {
      setKois(loadLocalFallback())
      setUsingApi(false)
    }
  }

  const value = useMemo<KoiCatalogContextValue>(() => {
    function getKoi(id: string): Koi | undefined {
      return kois.find((k) => k.id === id)
    }

    function findByImage(image: string): boolean {
      return kois.some((k) => k.image === image)
    }

    async function addKoi(input: AddKoiInput): Promise<Koi> {
      const name = input.name.trim()
      if (!name) throw new KoiCatalogError('Informe o nome da variedade.')
      const description = input.description.trim()
      if (!description) throw new KoiCatalogError('Informe uma descrição.')

      const payload = {
        name,
        nameJa: input.nameJa?.trim() || undefined,
        description,
        image: input.image.trim() || DEFAULT_IMAGE,
        group: input.group.trim() || 'Outros',
        colors: input.colors?.map((c) => c.trim()).filter(Boolean) ?? [],
      }

      if (usingApi) {
        const res = await fetch('/api/kois', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        if (res.ok) {
          const created = (await res.json()) as Koi
          setKois((prev) => [...prev, created])
          return created
        }
      }

      const base = slugify(name)
      let id = base
      let n = 2
      while (kois.some((k) => k.id === id)) {
        id = `${base}-${n}`
        n++
      }
      const koi: Koi = { ...payload, id }
      setKois((prev) => [...prev, koi])
      return koi
    }

    async function removeKoi(id: string) {
      if (usingApi) {
        try {
          await fetch(`/api/kois/${id}`, { method: 'DELETE' })
        } catch {
          // falha na API -> remove local mesmo assim
        }
      }
      setKois((prev) => prev.filter((k) => k.id !== id))
    }

    async function uploadImage(file: File): Promise<string> {
      const form = new FormData()
      form.append('image', file)
      const res = await fetch('/api/images', { method: 'POST', body: form })
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new KoiCatalogError(data?.error ?? 'Erro no upload da imagem.')
      }
      const data = await res.json()
      return data.url as string
    }

    async function updateKoi(id: string, input: UpdateKoiInput): Promise<Koi> {
      const name = input.name?.trim()
      if (name === '') throw new KoiCatalogError('Informe o nome da variedade.')
      const description = input.description?.trim()
      if (description === '') throw new KoiCatalogError('Informe uma descrição.')

      const payload: UpdateKoiInput = {}
      if (input.name !== undefined) payload.name = input.name.trim()
      if (input.nameJa !== undefined) payload.nameJa = input.nameJa.trim() || undefined
      if (input.description !== undefined) payload.description = input.description.trim()
      if (input.group !== undefined) payload.group = input.group.trim() || 'Outros'
      if (input.colors !== undefined)
        payload.colors = input.colors.map((c) => c.trim()).filter(Boolean)
      if (input.image !== undefined) payload.image = input.image.trim()

      if (usingApi) {
        const res = await fetch(`/api/kois/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        if (res.ok) {
          const updated = (await res.json()) as Koi
          setKois((prev) => prev.map((k) => (k.id === id ? updated : k)))
          return updated
        }
        const data = await res.json().catch(() => null)
        throw new KoiCatalogError(data?.error ?? 'Erro ao salvar alterações.')
      }

      const current = kois.find((k) => k.id === id)
      if (!current) throw new KoiCatalogError('Variedade não encontrada.')
      const updated: Koi = { ...current, ...payload, id }
      setKois((prev) => prev.map((k) => (k.id === id ? updated : k)))
      return updated
    }

    async function resetToInitial() {
      if (usingApi) {
        for (const k of kois) {
          try {
            await fetch(`/api/kois/${k.id}`, { method: 'DELETE' })
          } catch {
            // ignora falha individual
          }
        }
        await loadFromApi()
      }
      setKois(initialKois)
    }

    return {
      kois,
      loading,
      usingApi,
      getKoi,
      findByImage,
      addKoi,
      updateKoi,
      uploadImage,
      removeKoi,
      resetToInitial,
    }
  }, [kois, loading, usingApi])

  return <KoiCatalogContext.Provider value={value}>{children}</KoiCatalogContext.Provider>
}

export function useKoiCatalog(): KoiCatalogContextValue {
  const ctx = useContext(KoiCatalogContext)
  if (!ctx) {
    throw new Error('useKoiCatalog deve ser usado dentro de KoiCatalogProvider')
  }
  return ctx
}
