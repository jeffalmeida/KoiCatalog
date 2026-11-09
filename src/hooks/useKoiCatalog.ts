/**
 * Tipos e helpers do catálogo. O hook vive em koiCatalogContext (Provider único).
 */
export class KoiCatalogError extends Error {}

export interface AddKoiInput {
  name: string
  nameJa?: string
  description: string
  image: string
  group: string
  colors?: string[]
}

export type UpdateKoiInput = Partial<AddKoiInput>

export const DEFAULT_IMAGE =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400"><rect width="100%" height="100%" fill="#0f172a"/><text x="50%" y="50%" fill="#64748b" font-family="sans-serif" font-size="28" text-anchor="middle">Sem foto</text></svg>`,
  )

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

export {
  KoiCatalogProvider,
  useKoiCatalog,
  type KoiCatalogContextValue,
} from './koiCatalogContext'
