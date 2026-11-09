export type Region = 'body' | 'head' | 'dorsal'

export type KoiColor = {
  id: string
  name: string
  hex: string
  body: boolean
  head: boolean
  dorsal: boolean
  sort: number
}

export type Species = {
  id: string
  name: string
  sort: number
}

export type Fish = {
  id: string
  nickname: string
  speciesId: string | null
  bodyColorId: string
  headColorId: string | null
  dorsalColorId: string | null
  createdAt: string
  updatedAt: string
}

export type FishDraft = {
  id?: string
  nickname: string
  speciesId: string | null
  bodyColorId: string
  headColorId: string | null
  dorsalColorId: string | null
}

export type CatalogSnapshot = {
  colors: KoiColor[]
  species: Species[]
  fish: Fish[]
}

export type CatalogMode = 'local' | 'supabase'
