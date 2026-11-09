import { createContext, useContext } from 'react'
import type { CatalogMode, Fish, FishDraft, KoiColor, Species } from './types.ts'

export type CatalogValue = {
  mode: CatalogMode
  email: string | null
  colors: KoiColor[]
  species: Species[]
  fish: Fish[]
  reload: () => Promise<void>
  saveFish: (draft: FishDraft) => Promise<void>
  deleteFish: (id: string) => Promise<void>
  saveColor: (color: KoiColor) => Promise<void>
  deleteColor: (id: string) => Promise<void>
  saveSpecies: (species: Species) => Promise<void>
  deleteSpecies: (id: string) => Promise<void>
  signOut: () => Promise<void>
}

export const CatalogContext = createContext<CatalogValue | null>(null)

export function useCatalog(): CatalogValue {
  const value = useContext(CatalogContext)
  if (!value) throw new Error('O inventário ainda não está disponível.')
  return value
}
