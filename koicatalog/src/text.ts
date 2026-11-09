import type { Fish, KoiColor, Region, Species } from './types.ts'

export const REGION_LABEL: Record<Region, string> = {
  body: 'Cor predominante',
  head: 'Mancha próxima da cabeça',
  dorsal: 'Mancha dorsal',
}

export function countLabel(count: number): string {
  if (count === 0) return 'Nenhuma carpa'
  if (count === 1) return '1 carpa'
  return `${count} carpas`
}

export function findByName<T extends { name: string }>(items: T[], name: string): T | undefined {
  const key = name.trim().toLocaleLowerCase('pt-BR')
  return items.find((item) => item.name.trim().toLocaleLowerCase('pt-BR') === key)
}

export function errorText(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback
}

export function sortByOrder<T extends { sort: number; name: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => a.sort - b.sort || a.name.localeCompare(b.name, 'pt'))
}

export function fishPaint(
  colors: KoiColor[],
  fish: { bodyColorId: string; headColorId: string | null; dorsalColorId: string | null },
): { body: string; head: string | null; dorsal: string | null } {
  const hex = (id: string | null) => (id ? colors.find((color) => color.id === id)?.hex ?? null : null)
  return {
    body: hex(fish.bodyColorId) ?? '#d9d3c7',
    head: hex(fish.headColorId),
    dorsal: hex(fish.dorsalColorId),
  }
}

export function patternSummary(
  colors: KoiColor[],
  fish: { bodyColorId: string; headColorId: string | null; dorsalColorId: string | null },
): string {
  const nameOf = (id: string | null) => (id ? colors.find((color) => color.id === id)?.name ?? 'removida' : 'Nenhuma')
  return `Corpo ${nameOf(fish.bodyColorId)} · Cabeça ${nameOf(fish.headColorId)} · Dorsal ${nameOf(fish.dorsalColorId)}`
}

export function speciesName(species: Species[], id: string | null): string {
  if (!id) return 'Sem espécie'
  return species.find((item) => item.id === id)?.name ?? 'Sem espécie'
}

export function colorInUse(fish: Fish[], colorId: string): boolean {
  return fish.some(
    (item) => item.bodyColorId === colorId || item.headColorId === colorId || item.dorsalColorId === colorId,
  )
}

export function speciesInUse(fish: Fish[], speciesId: string): boolean {
  return fish.some((item) => item.speciesId === speciesId)
}
