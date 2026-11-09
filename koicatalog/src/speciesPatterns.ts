import { findByName } from './text.ts'
import type { KoiColor } from './types.ts'

export type SpeciesPattern = {
  body: string
  head: string | null
  dorsal: string | null
}

const SPECIES_PATTERNS: Record<string, SpeciesPattern> = {
  kohaku: { body: 'Branco', head: 'Vermelho', dorsal: 'Vermelho' },
  sanke: { body: 'Branco', head: 'Vermelho', dorsal: 'Preto' },
  showa: { body: 'Preto', head: 'Vermelho', dorsal: 'Branco' },
  tancho: { body: 'Branco', head: 'Vermelho', dorsal: null },
  kujaku: { body: 'Branco', head: 'Alaranjado', dorsal: 'Preto' },
  asagi: { body: 'Azul', head: 'Vermelho', dorsal: null },
  shusui: { body: 'Azul', head: 'Vermelho', dorsal: 'Preto' },
  goromo: { body: 'Branco', head: 'Vermelho', dorsal: 'Preto' },
  goshiki: { body: 'Branco', head: 'Vermelho', dorsal: 'Preto' },
  matsuba: { body: 'Dourado', head: null, dorsal: 'Preto' },
  chagoi: { body: 'Marrom', head: null, dorsal: null },
  soragoi: { body: 'Cinza', head: null, dorsal: null },
  ochiba: { body: 'Cinza', head: 'Amarelo', dorsal: null },
  benigoi: { body: 'Vermelho', head: null, dorsal: null },
  hariwake: { body: 'Amarelo', head: 'Branco', dorsal: null },
  'shiro utsuri': { body: 'Preto', head: 'Branco', dorsal: 'Branco' },
  'hi utsuri': { body: 'Preto', head: 'Vermelho', dorsal: 'Vermelho' },
  'kin ki utsuri': { body: 'Preto', head: 'Amarelo', dorsal: 'Amarelo' },
  kumonryu: { body: 'Branco', head: null, dorsal: 'Preto' },
  kikokuryu: { body: 'Branco', head: 'Alaranjado', dorsal: 'Preto' },
  'kin kikokuryu': { body: 'Dourado', head: null, dorsal: 'Preto' },
  'platinum ogon': { body: 'Prata', head: null, dorsal: null },
  'yamabuki ogon': { body: 'Amarelo', head: null, dorsal: null },
  kikusui: { body: 'Branco', head: 'Amarelo', dorsal: 'Amarelo' },
  bekko: { body: 'Branco', head: null, dorsal: 'Preto' },
  hirenaga: { body: 'Preto', head: 'Branco', dorsal: 'Vermelho' },
}

export function speciesPattern(name: string): SpeciesPattern | null {
  return SPECIES_PATTERNS[name.trim().toLocaleLowerCase('pt-BR')] ?? null
}

export function colorsFollowPattern(
  colors: KoiColor[],
  pattern: SpeciesPattern,
  bodyColorId: string,
  headColorId: string | null,
  dorsalColorId: string | null,
) {
  const idOf = (name: string | null) => (name ? (findByName(colors, name)?.id ?? null) : null)
  return idOf(pattern.body) === bodyColorId && idOf(pattern.head) === headColorId && idOf(pattern.dorsal) === dorsalColorId
}

export function previewPaint(colors: KoiColor[], speciesName: string) {
  const pattern = speciesPattern(speciesName)
  const hex = (name: string | null) => (name ? (findByName(colors, name)?.hex ?? null) : null)
  if (!pattern) return { body: '#d9d3c7', head: null, dorsal: null }
  return {
    body: hex(pattern.body) ?? '#d9d3c7',
    head: hex(pattern.head),
    dorsal: hex(pattern.dorsal),
  }
}
