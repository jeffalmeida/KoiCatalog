import type { SupabaseClient } from '@supabase/supabase-js'
import { createSeed, DEFAULT_COLORS, DEFAULT_SPECIES_NAMES, retintStoredColors, syncGuideSpecies } from './defaults.ts'
import { isSupabaseConfigured, supabase } from './lib/supabase.ts'
import { sortByOrder } from './text.ts'
import type { CatalogMode, CatalogSnapshot, Fish, FishDraft, KoiColor, Species } from './types.ts'

const STORAGE_KEY = 'koicatalog.v1'
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const FISH_COLUMNS =
  'id, nickname, species_id, body_color_id, head_color_id, dorsal_color_id, created_at, updated_at'

type ColorRow = {
  id: string
  name: string
  hex: string
  body: boolean
  head: boolean
  dorsal: boolean
  sort: number
}

type SpeciesRow = {
  id: string
  name: string
  sort: number
}

type FishRow = {
  id: string
  nickname: string | null
  species_id: string | null
  body_color_id: string
  head_color_id: string | null
  dorsal_color_id: string | null
  created_at: string
  updated_at: string
}

type QueryError = { message: string; code?: string } | null

export class CatalogError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'CatalogError'
  }
}

export type Repository = {
  mode: CatalogMode
  load: () => Promise<CatalogSnapshot>
  saveFish: (draft: FishDraft) => Promise<Fish>
  deleteFish: (id: string) => Promise<void>
  saveColor: (color: KoiColor) => Promise<KoiColor>
  deleteColor: (id: string) => Promise<void>
  saveSpecies: (species: Species) => Promise<Species>
  deleteSpecies: (id: string) => Promise<void>
}

let inflight: Promise<CatalogSnapshot> | null = null

export function resetCatalogCache() {
  inflight = null
}

export function loadCatalog(repo: Repository): Promise<CatalogSnapshot> {
  if (!inflight) {
    inflight = repo.load().catch((error: unknown) => {
      inflight = null
      throw error
    })
  }
  return inflight
}

export function createRepository(): Repository {
  if (isSupabaseConfigured && supabase) return supabaseRepository(supabase)
  return localRepository()
}

function fail(error: QueryError, action: 'load' | 'save' | 'delete'): void {
  if (!error) return
  console.error(error.message)
  if (error.code === 'PGRST116') throw new CatalogError('Carpa não encontrada.')
  if (action === 'load') throw new CatalogError('Não foi possível abrir o inventário.')
  if (action === 'delete') throw new CatalogError('Não foi possível excluir. Tente de novo.')
  throw new CatalogError('Não foi possível salvar. Tente de novo.')
}

async function run<T>(action: 'load' | 'save' | 'delete', work: () => Promise<T>): Promise<T> {
  try {
    return await work()
  } catch (error) {
    if (error instanceof CatalogError) throw error
    console.error(error)
    if (action === 'load') throw new CatalogError('Não foi possível abrir o inventário.')
    if (action === 'delete') throw new CatalogError('Não foi possível excluir. Tente de novo.')
    throw new CatalogError('Não foi possível salvar. Tente de novo.')
  }
}

function assertId(id: string) {
  if (!UUID_RE.test(id)) throw new CatalogError('Não foi possível salvar. Tente de novo.')
}

function assertName(name: string, kind: 'cor' | 'espécie'): string {
  const trimmed = name.trim()
  if (!trimmed) {
    throw new CatalogError(kind === 'cor' ? 'Dê um nome à cor.' : 'Dê um nome à espécie.')
  }
  if (trimmed.length > 40) throw new CatalogError('Use um nome mais curto.')
  return trimmed
}

function assertHex(hex: string): string {
  if (!/^#[0-9a-fA-F]{6}$/.test(hex)) throw new CatalogError('Escolha uma cor válida.')
  return hex.toLowerCase()
}

function assertDraft(draft: FishDraft) {
  const nickname = draft.nickname.trim()
  if (nickname.length > 60) throw new CatalogError('Use um apelido mais curto.')
  if (!draft.bodyColorId) throw new CatalogError('Escolha a cor predominante.')
  assertId(draft.bodyColorId)
  if (draft.headColorId) assertId(draft.headColorId)
  if (draft.dorsalColorId) assertId(draft.dorsalColorId)
  if (draft.speciesId) assertId(draft.speciesId)
  if (draft.id) assertId(draft.id)
  return nickname
}

function sortFish(fish: Fish[]): Fish[] {
  return [...fish].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

function present(snapshot: CatalogSnapshot): CatalogSnapshot {
  return {
    colors: sortByOrder(snapshot.colors),
    species: sortByOrder(snapshot.species),
    fish: sortFish(snapshot.fish),
  }
}

function toColor(row: ColorRow): KoiColor {
  return {
    id: row.id,
    name: row.name,
    hex: row.hex,
    body: row.body,
    head: row.head,
    dorsal: row.dorsal,
    sort: row.sort,
  }
}

function toSpecies(row: SpeciesRow): Species {
  return { id: row.id, name: row.name, sort: row.sort }
}

function toFish(row: FishRow): Fish {
  return {
    id: row.id,
    nickname: row.nickname ?? '',
    speciesId: row.species_id,
    bodyColorId: row.body_color_id,
    headColorId: row.head_color_id,
    dorsalColorId: row.dorsal_color_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function readLocal(): CatalogSnapshot | null {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return null
  const parsed = JSON.parse(raw) as Partial<CatalogSnapshot>
  if (!Array.isArray(parsed.colors) || !Array.isArray(parsed.species) || !Array.isArray(parsed.fish)) {
    return null
  }
  return { colors: parsed.colors, species: parsed.species, fish: parsed.fish }
}

function writeLocal(snapshot: CatalogSnapshot) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot))
}

function readOrSeed(): CatalogSnapshot {
  const existing = readLocal()
  if (!existing) {
    const seed = createSeed()
    writeLocal(seed)
    return seed
  }
  const colors = retintStoredColors(existing.colors) ?? existing.colors
  const species = syncGuideSpecies(existing.species, existing.fish) ?? existing.species
  if (colors === existing.colors && species === existing.species) return existing
  const tuned = { ...existing, colors, species }
  writeLocal(tuned)
  return tuned
}

function localRepository(): Repository {
  return {
    mode: 'local',
    load: () => run('load', async () => present(readOrSeed())),
    saveFish: (draft) =>
      run('save', async () => {
        const nickname = assertDraft(draft)
        const snap = readOrSeed()
        const now = new Date().toISOString()
        let saved: Fish
        if (draft.id) {
          const existing = snap.fish.find((fish) => fish.id === draft.id)
          if (!existing) throw new CatalogError('Carpa não encontrada.')
          saved = {
            ...existing,
            nickname,
            speciesId: draft.speciesId,
            bodyColorId: draft.bodyColorId,
            headColorId: draft.headColorId,
            dorsalColorId: draft.dorsalColorId,
            updatedAt: now,
          }
          snap.fish = snap.fish.map((fish) => (fish.id === saved.id ? saved : fish))
        } else {
          saved = {
            id: crypto.randomUUID(),
            nickname,
            speciesId: draft.speciesId,
            bodyColorId: draft.bodyColorId,
            headColorId: draft.headColorId,
            dorsalColorId: draft.dorsalColorId,
            createdAt: now,
            updatedAt: now,
          }
          snap.fish = [saved, ...snap.fish]
        }
        writeLocal(snap)
        return saved
      }),
    deleteFish: (id) =>
      run('delete', async () => {
        assertId(id)
        const snap = readOrSeed()
        snap.fish = snap.fish.filter((fish) => fish.id !== id)
        writeLocal(snap)
      }),
    saveColor: (color) =>
      run('save', async () => {
        assertId(color.id)
        const name = assertName(color.name, 'cor')
        const hex = assertHex(color.hex)
        if (!color.body && !color.head && !color.dorsal) {
          throw new CatalogError('Cada cor precisa servir para pelo menos uma região.')
        }
        const snap = readOrSeed()
        if (!color.body) {
          const keepsBody = snap.colors.some((item) => item.id !== color.id && item.body)
          const wasBody = snap.colors.find((item) => item.id === color.id)?.body ?? false
          if (wasBody && !keepsBody) throw new CatalogError('Mantenha pelo menos uma cor de corpo.')
        }
        const next: KoiColor = { ...color, name, hex }
        const exists = snap.colors.some((item) => item.id === color.id)
        snap.colors = exists
          ? snap.colors.map((item) => (item.id === color.id ? next : item))
          : [...snap.colors, next]
        writeLocal(snap)
        return next
      }),
    deleteColor: (id) =>
      run('delete', async () => {
        assertId(id)
        const snap = readOrSeed()
        const color = snap.colors.find((item) => item.id === id)
        if (!color) return
        if (color.body && snap.colors.filter((item) => item.body).length <= 1) {
          throw new CatalogError('Mantenha pelo menos uma cor de corpo.')
        }
        const used = snap.fish.some(
          (fish) => fish.bodyColorId === id || fish.headColorId === id || fish.dorsalColorId === id,
        )
        if (used) throw new CatalogError('Esta cor está em uso.')
        snap.colors = snap.colors.filter((item) => item.id !== id)
        writeLocal(snap)
      }),
    saveSpecies: (species) =>
      run('save', async () => {
        assertId(species.id)
        const name = assertName(species.name, 'espécie')
        const snap = readOrSeed()
        const next: Species = { ...species, name }
        const exists = snap.species.some((item) => item.id === species.id)
        snap.species = exists
          ? snap.species.map((item) => (item.id === species.id ? next : item))
          : [...snap.species, next]
        writeLocal(snap)
        return next
      }),
    deleteSpecies: (id) =>
      run('delete', async () => {
        assertId(id)
        const snap = readOrSeed()
        if (snap.fish.some((fish) => fish.speciesId === id)) {
          throw new CatalogError('Esta espécie está em uso.')
        }
        snap.species = snap.species.filter((item) => item.id !== id)
        writeLocal(snap)
      }),
  }
}

async function requireUserId(client: SupabaseClient): Promise<string> {
  const { data, error } = await client.auth.getSession()
  if (error || !data.session) throw new CatalogError('Entre de novo para continuar.')
  return data.session.user.id
}

async function fetchAll(client: SupabaseClient): Promise<CatalogSnapshot> {
  const [colorsRes, speciesRes, fishRes] = await Promise.all([
    client.from('colors').select('id, name, hex, body, head, dorsal, sort').order('sort'),
    client.from('species').select('id, name, sort').order('sort'),
    client.from('fish').select(FISH_COLUMNS).order('created_at', { ascending: false }),
  ])
  fail(colorsRes.error, 'load')
  fail(speciesRes.error, 'load')
  fail(fishRes.error, 'load')
  return present({
    colors: ((colorsRes.data ?? []) as ColorRow[]).map(toColor),
    species: ((speciesRes.data ?? []) as SpeciesRow[]).map(toSpecies),
    fish: ((fishRes.data ?? []) as FishRow[]).map(toFish),
  })
}

async function seedIfEmpty(client: SupabaseClient, userId: string, snap: CatalogSnapshot): Promise<CatalogSnapshot> {
  if (snap.colors.length > 0 || snap.species.length > 0 || snap.fish.length > 0) return snap

  const colorsInserted = await client.from('colors').insert(
    DEFAULT_COLORS.map((color) => ({
      user_id: userId,
      name: color.name,
      hex: color.hex,
      body: color.body,
      head: color.head,
      dorsal: color.dorsal,
      sort: color.sort,
    })),
  )
  fail(colorsInserted.error, 'load')

  const speciesInserted = await client.from('species').insert(
    DEFAULT_SPECIES_NAMES.map((name, sort) => ({ user_id: userId, name, sort })),
  )
  if (speciesInserted.error) {
    await client.from('colors').delete().eq('user_id', userId)
    fail(speciesInserted.error, 'load')
  }

  return fetchAll(client)
}

function supabaseRepository(client: SupabaseClient): Repository {
  return {
    mode: 'supabase',
    load: () =>
      run('load', async () => {
        const userId = await requireUserId(client)
        const snap = await fetchAll(client)
        return seedIfEmpty(client, userId, snap)
      }),
    saveFish: (draft) =>
      run('save', async () => {
        const nickname = assertDraft(draft)
        const now = new Date().toISOString()
        const payload = {
          nickname,
          species_id: draft.speciesId,
          body_color_id: draft.bodyColorId,
          head_color_id: draft.headColorId,
          dorsal_color_id: draft.dorsalColorId,
          updated_at: now,
        }
        if (draft.id) {
          const { data, error } = await client.from('fish').update(payload).eq('id', draft.id).select(FISH_COLUMNS).single()
          if (error || !data) {
            fail(error, 'save')
            throw new CatalogError('Não foi possível salvar. Tente de novo.')
          }
          return toFish(data as FishRow)
        }
        const { data, error } = await client
          .from('fish')
          .insert({
            ...payload,
            id: crypto.randomUUID(),
            user_id: await requireUserId(client),
            created_at: now,
          })
          .select(FISH_COLUMNS)
          .single()
        if (error || !data) {
          fail(error, 'save')
          throw new CatalogError('Não foi possível salvar. Tente de novo.')
        }
        return toFish(data as FishRow)
      }),
    deleteFish: (id) =>
      run('delete', async () => {
        assertId(id)
        const { error } = await client.from('fish').delete().eq('id', id)
        fail(error, 'delete')
      }),
    saveColor: (color) =>
      run('save', async () => {
        assertId(color.id)
        const name = assertName(color.name, 'cor')
        const hex = assertHex(color.hex)
        if (!color.body && !color.head && !color.dorsal) {
          throw new CatalogError('Cada cor precisa servir para pelo menos uma região.')
        }
        if (!color.body) {
          const { data, error } = await client.from('colors').select('id, body')
          fail(error, 'save')
          const rows = (data ?? []) as Array<{ id: string; body: boolean }>
          const wasBody = rows.find((item) => item.id === color.id)?.body ?? false
          const keepsBody = rows.some((item) => item.id !== color.id && item.body)
          if (wasBody && !keepsBody) throw new CatalogError('Mantenha pelo menos uma cor de corpo.')
        }
        const payload = { name, hex, body: color.body, head: color.head, dorsal: color.dorsal, sort: color.sort }
        const { data: existing, error: existingError } = await client.from('colors').select('id').eq('id', color.id).maybeSingle()
        fail(existingError, 'save')
        if (existing) {
          const { error } = await client.from('colors').update(payload).eq('id', color.id)
          fail(error, 'save')
        } else {
          const { error } = await client.from('colors').insert({ ...payload, id: color.id, user_id: await requireUserId(client) })
          fail(error, 'save')
        }
        return { ...color, name, hex }
      }),
    deleteColor: (id) =>
      run('delete', async () => {
        assertId(id)
        const { data, error } = await client.from('colors').select('id, body')
        fail(error, 'delete')
        const rows = (data ?? []) as Array<{ id: string; body: boolean }>
        const color = rows.find((item) => item.id === id)
        if (!color) return
        if (color.body && rows.filter((item) => item.body).length <= 1) {
          throw new CatalogError('Mantenha pelo menos uma cor de corpo.')
        }
        const used = await client
          .from('fish')
          .select('id', { count: 'exact', head: true })
          .or(`body_color_id.eq.${id},head_color_id.eq.${id},dorsal_color_id.eq.${id}`)
        fail(used.error, 'delete')
        if ((used.count ?? 0) > 0) throw new CatalogError('Esta cor está em uso.')
        const removed = await client.from('colors').delete().eq('id', id)
        fail(removed.error, 'delete')
      }),
    saveSpecies: (species) =>
      run('save', async () => {
        assertId(species.id)
        const name = assertName(species.name, 'espécie')
        const { data: existing, error: existingError } = await client.from('species').select('id').eq('id', species.id).maybeSingle()
        fail(existingError, 'save')
        if (existing) {
          const { error } = await client.from('species').update({ name, sort: species.sort }).eq('id', species.id)
          fail(error, 'save')
        } else {
          const { error } = await client
            .from('species')
            .insert({ id: species.id, user_id: await requireUserId(client), name, sort: species.sort })
          fail(error, 'save')
        }
        return { ...species, name }
      }),
    deleteSpecies: (id) =>
      run('delete', async () => {
        assertId(id)
        const used = await client.from('fish').select('id', { count: 'exact', head: true }).eq('species_id', id)
        fail(used.error, 'delete')
        if ((used.count ?? 0) > 0) throw new CatalogError('Esta espécie está em uso.')
        const removed = await client.from('species').delete().eq('id', id)
        fail(removed.error, 'delete')
      }),
  }
}
