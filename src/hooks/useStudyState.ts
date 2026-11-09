import { useEffect, useState } from 'react'
import type { StudyState } from '../types'

const STORAGE_KEY = 'koi-study-v1'

const INITIAL_BOX_DELAY: Record<number, number> = {
  0: 0, // não visto: imediato
  1: 1, // ~1 dia
  2: 3, // ~3 dias
  3: 7, // ~1 semana
  4: 14, // ~2 semanas
}

const DAY_MS = 24 * 60 * 60 * 1000

function nowMs(): number {
  return Date.now()
}

/**
 * Carrega o estado de estudo persistido.
 */
function loadStudy(): StudyState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (parsed && typeof parsed === 'object') return parsed
    }
  } catch {
    // corrompido -> estado vazio
  }
  return {}
}

/**
 * Hook do estado de repetição espaçada do estudo.
 */
export function useStudyState() {
  const [study, setStudy] = useState<StudyState>(loadStudy)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(study))
    } catch {
      // storage cheio -> ignora
    }
  }, [study])

  /**
   * Registra o resultado de um cartão de um koi.
   */
  function record(koiId: string, correct: boolean) {
    const today = nowMs()
    setStudy((prev) => {
      const prevKoi = prev[koiId]
      const streak = prevKoi?.streak ?? 0
      const nextStreak = correct ? streak + 1 : 0

      // caixa: erro volta para caixa 0; acerto sobe a caixa com teto
      let nextBox: number
      if (!correct) {
        nextBox = 0
      } else {
        nextBox = Math.min((prevKoi?.box ?? 0) + 1, 4)
      }

      const dueInMs = nextBox === 0 ? 0 : INITIAL_BOX_DELAY[nextBox] * DAY_MS

      return {
        ...prev,
        [koiId]: {
          box: nextBox,
          streak: nextStreak,
          lastSeen: today,
          dueAt: today + dueInMs,
        },
      }
    })
  }

  /**
   * Retorna os cartões devidos e pendentes para estudar, com ambos os sentidos.
   */
  function buildDeck(koiIds: string[]): string[] {
    const now = nowMs()
    const due: string[] = []
    const unseen: string[] = []

    for (const id of koiIds) {
      const s = study[id]
      if (!s) {
        unseen.push(id)
        continue
      }
      // atrasado ou nunca visto -> devido
      if (s.dueAt === undefined || s.dueAt <= now) {
        due.push(id)
        continue
      }
    }

    // cartões novos entram primeiro (nunca vistos)
    const ordered = [...shuffle(unseen), ...shuffle(due)]
    return ordered
  }

  /**
   * Progresso dos cartões (apenas para exibição).
   */
  function progress(koiIds: string[]): { total: number; mastered: number; studied: number } {
    const mastered = koiIds.filter((id) => (study[id]?.box ?? 0) >= 4).length
    const studied = koiIds.filter((id) => study[id]).length
    return { total: koiIds.length, mastered, studied }
  }

  return { study, record, buildDeck, progress }
}

/**
 * Embaralha um array (Fisher–Yates).
 */
function shuffle<T>(items: T[]): T[] {
  const arr = [...items]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}