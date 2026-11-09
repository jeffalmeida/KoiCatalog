import type { CatalogSnapshot, Fish, KoiColor, Species } from './types.ts'

export const DEFAULT_COLORS: Array<Omit<KoiColor, 'id'>> = [
  { name: 'Branco', hex: '#f3efe6', body: true, head: true, dorsal: true, sort: 0 },
  { name: 'Vermelho', hex: '#d12d2a', body: true, head: true, dorsal: true, sort: 1 },
  { name: 'Alaranjado', hex: '#f07818', body: true, head: true, dorsal: true, sort: 2 },
  { name: 'Preto', hex: '#1a1a1a', body: true, head: true, dorsal: true, sort: 3 },
  { name: 'Amarelo', hex: '#ffe14a', body: true, head: true, dorsal: true, sort: 4 },
  { name: 'Azul', hex: '#3f7594', body: true, head: true, dorsal: true, sort: 5 },
  { name: 'Dourado', hex: '#f0b429', body: true, head: true, dorsal: true, sort: 6 },
  { name: 'Prata', hex: '#b7c4ce', body: true, head: true, dorsal: true, sort: 7 },
  { name: 'Marrom', hex: '#a56b45', body: true, head: true, dorsal: true, sort: 8 },
  { name: 'Cinza', hex: '#7d828a', body: true, head: true, dorsal: true, sort: 9 },
]

const LEGACY_COLOR_HEX: Record<string, string[]> = {
  amarelo: ['#e8b423'],
  dourado: ['#c6a15b', '#a56b0b'],
  ouro: ['#c6a15b', '#a56b0b'],
}

const SILVER_NAMES = new Set(['prata', 'prateada', 'prateado'])

function colorKey(name: string) {
  return name.trim().toLocaleLowerCase('pt-BR')
}

export function retintStoredColors(colors: KoiColor[]): KoiColor[] | null {
  const silverHex = DEFAULT_COLORS.find((color) => color.name === 'Prata')?.hex ?? '#b7c4ce'
  const currentHex = new Map(DEFAULT_COLORS.map((color) => [colorKey(color.name), color.hex]))
  let changed = false
  const next = colors.map((color) => {
    const key = colorKey(color.name)
    if (SILVER_NAMES.has(key) && color.hex.toLowerCase() !== silverHex) {
      changed = true
      return { ...color, hex: silverHex }
    }
    const legacy = LEGACY_COLOR_HEX[key]
    const updated = currentHex.get(key === 'ouro' ? 'dourado' : key)
    if (legacy && updated && legacy.includes(color.hex.toLowerCase())) {
      changed = true
      return { ...color, hex: updated }
    }
    return color
  })
  for (const name of ['Prata', 'Marrom', 'Cinza']) {
    if (next.some((color) => colorKey(color.name) === colorKey(name))) continue
    const template = DEFAULT_COLORS.find((color) => color.name === name)
    if (!template) continue
    const sort = next.reduce((max, color) => Math.max(max, color.sort), -1) + 1
    next.push({ id: crypto.randomUUID(), ...template, sort })
    changed = true
  }
  return changed ? next : null
}

const RETIRED_SPECIES = new Set(['ogon', 'utsuri'])

export function syncGuideSpecies(species: Species[], fish: Fish[]): Species[] | null {
  const key = (name: string) => name.trim().toLocaleLowerCase('pt-BR')
  const byName = new Map(species.map((item) => [key(item.name), item]))
  const used = new Set(fish.map((item) => item.speciesId).filter((id): id is string => Boolean(id)))
  const next: Species[] = []
  let changed = false

  DEFAULT_SPECIES_NAMES.forEach((name, sort) => {
    const existing = byName.get(key(name))
    if (!existing) {
      changed = true
      next.push({ id: crypto.randomUUID(), name, sort })
      return
    }
    if (existing.name !== name || existing.sort !== sort) changed = true
    next.push({ ...existing, name, sort })
  })

  const guideKeys = new Set(DEFAULT_SPECIES_NAMES.map(key))
  for (const item of species) {
    if (guideKeys.has(key(item.name))) continue
    if (used.has(item.id) || !RETIRED_SPECIES.has(key(item.name))) {
      const sort = next.length
      if (item.sort !== sort) changed = true
      next.push({ ...item, sort })
    } else {
      changed = true
    }
  }

  return changed ? next : null
}

export const DEFAULT_SPECIES_NAMES = [
  'Kohaku',
  'Sanke',
  'Showa',
  'Tancho',
  'Kujaku',
  'Asagi',
  'Shusui',
  'Goromo',
  'Goshiki',
  'Matsuba',
  'Chagoi',
  'Soragoi',
  'Ochiba',
  'Benigoi',
  'Hariwake',
  'Shiro Utsuri',
  'Hi Utsuri',
  'Kin Ki Utsuri',
  'Kumonryu',
  'Kikokuryu',
  'Kin Kikokuryu',
  'Platinum Ogon',
  'Yamabuki Ogon',
  'Kikusui',
  'Bekko',
  'Hirenaga',
]

export function createSeed(): CatalogSnapshot {
  return {
    colors: DEFAULT_COLORS.map((color) => ({ ...color, id: crypto.randomUUID() })),
    species: DEFAULT_SPECIES_NAMES.map((name, sort) => ({
      id: crypto.randomUUID(),
      name,
      sort,
    })),
    fish: [],
  }
}
