export interface Koi {
  id: string
  name: string
  nameJa?: string
  description: string
  image: string
  group: string
  colors: string[]
}

export type KoiSide = 'photo' | 'name'

export interface StudyState {
  [koiId: string]: {
    box: number
    streak: number
    lastSeen: number
    dueAt: number
  }
}