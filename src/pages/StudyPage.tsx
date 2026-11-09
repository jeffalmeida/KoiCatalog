import { useMemo, useState } from 'react'
import type { Koi, KoiSide } from '../types'
import { useKoiCatalog } from '../hooks/useKoiCatalog'
import { useStudyState } from '../hooks/useStudyState'

type Phase = 'setup' | 'cards' | 'done'

export function StudyPage() {
  const { kois } = useKoiCatalog()
  const { buildDeck, record, progress } = useStudyState()

  const [phase, setPhase] = useState<Phase>('setup')
  const [sides, setSides] = useState<KoiSide[]>(['photo', 'name'])
  const [deck, setDeck] = useState<{ koi: Koi; side: KoiSide }[]>([])
  const [cursor, setCursor] = useState(0)
  const [revealed, setRevealed] = useState(false)
  const [answered, setAnswered] = useState(false)
  const [sessionStats, setSessionStats] = useState({ correct: 0, wrong: 0 })
  const [shuffleOpt, setShuffleOpt] = useState(true)

  const prog = useMemo(() => progress(kois.map((k) => k.id)), [kois, progress])

  function start() {
    const built = buildDeck(kois.map((k) => k.id))
    const items = built
      .map((id) => {
        const koi = kois.find((k) => k.id === id)
        if (!koi) return null
        const side = sides[Math.floor(Math.random() * sides.length)]
        return { koi, side }
      })
      .filter((x): x is { koi: Koi; side: KoiSide } => x !== null)

    if (items.length === 0) {
      // nada devido: mesmo assim estuda um punhado
      const all = kois.map((k) => k.id)
      const ids = all.length > 6 ? shuffle(all).slice(0, 6) : all
      const fallback = ids
        .map((id) => kois.find((k) => k.id === id))
        .map((koi) => ({ koi: koi!, side: sides[Math.floor(Math.random() * sides.length)] }))
      setDeck(fallback)
      setCursor(0)
      setRevealed(false)
      setAnswered(false)
      setSessionStats({ correct: 0, wrong: 0 })
      setPhase('cards')
      return
    }

    setDeck(items)
    setCursor(0)
    setRevealed(false)
    setAnswered(false)
    setSessionStats({ correct: 0, wrong: 0 })
    setPhase('cards')
  }

  const current = deck[cursor]
  const totalDone = sessionStats.correct + sessionStats.wrong

  function answer(correct: boolean, koiId: string) {
    if (answered) return
    setAnswered(true)
    setSessionStats((s) => (correct ? { ...s, correct: s.correct + 1 } : { ...s, wrong: s.wrong + 1 }))
    record(koiId, correct)
  }

  function next() {
    if (cursor + 1 >= deck.length) {
      setPhase('done')
      return
    }
    setCursor((c) => c + 1)
    setRevealed(false)
    setAnswered(false)
  }

  const mastered = prog.mastered
  const studied = prog.studied

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      {phase === 'setup' && (
        <div className="rounded-2xl border border-white/10 bg-slate-900 p-6 sm:p-8">
          <h1 className="text-2xl font-bold text-white">Estudar variedades</h1>
          <p className="mt-2 text-sm text-slate-400">
            O app mostra cartões nos dois sentidos e usa repetição espaçada: os errados voltam rápido,
            os certos aparecem cada vez menos.
          </p>

          <div className="mt-6">
            <h3 className="text-xs font-medium tracking-wide text-slate-500 uppercase">Seu progresso</h3>
            <div className="mt-2 flex flex-wrap gap-3 text-sm">
              <span className="rounded-lg bg-white/5 px-3 py-1.5 text-slate-300">
                <span className="font-semibold text-white">{prog.total}</span> no catálogo
              </span>
              <span className="rounded-lg bg-white/5 px-3 py-1.5 text-slate-300">
                <span className="font-semibold text-cyan-400">{studied}</span> já estudados
              </span>
              <span className="rounded-lg bg-white/5 px-3 py-1.5 text-slate-300">
                <span className="font-semibold text-emerald-400">{mastered}</span> dominados
              </span>
            </div>
          </div>

          <div className="mt-6">
            <h3 className="text-xs font-medium tracking-wide text-slate-500 uppercase">Sentido dos cartões</h3>
            <div className="mt-2 flex flex-wrap gap-2">
              {(
                [
                  { id: 'photo', label: 'Foto → Nome' },
                  { id: 'name', label: 'Nome → Foto' },
                ] as { id: KoiSide; label: string }[]
              ).map((opt) => {
                const active = sides.includes(opt.id)
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => {
                      setSides((prev) =>
                        active ? prev.filter((s) => s !== opt.id) : [...prev, opt.id],
                      )
                    }}
                    className={
                      'rounded-lg border px-4 py-2 text-sm transition ' +
                      (active
                        ? 'border-cyan-500/60 bg-cyan-500/15 text-cyan-300'
                        : 'border-white/10 bg-white/5 text-slate-400 hover:bg-white/10')
                    }
                  >
                    {opt.label}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="mt-6">
            <h3 className="text-xs font-medium tracking-wide text-slate-500 uppercase">Embaralhar ordem</h3>
            <button
              type="button"
              onClick={() => setShuffleOpt((v) => !v)}
              className={
                'mt-2 rounded-lg border px-4 py-2 text-sm transition ' +
                (shuffleOpt
                  ? 'border-cyan-500/60 bg-cyan-500/15 text-cyan-300'
                  : 'border-white/10 bg-white/5 text-slate-400 hover:bg-white/10')
              }
            >
              {shuffleOpt ? 'Sim, embaralhar' : 'Não, em ordem'}
            </button>
          </div>

          <button
            type="button"
            onClick={start}
            disabled={sides.length === 0}
            className="mt-8 w-full rounded-xl bg-cyan-500 px-4 py-3 text-base font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Começar a estudar
          </button>
        </div>
      )}

      {phase === 'cards' && current && (
        <FlashcardView
          item={current}
          revealed={revealed}
          answered={answered}
          total={deck.length}
          done={totalDone}
          onReveal={() => setRevealed(true)}
          onAnswer={(correct) => answer(correct, current.koi.id)}
          onNext={next}
          onSkip={() => {
            setRevealed(true)
            setAnswered(true)
            answer(true, current.koi.id) // conta skip como acerto leve (não é erro)
          }}
        />
      )}

      {phase === 'done' && (
        <div className="rounded-2xl border border-white/10 bg-slate-900 p-8 text-center">
          <h2 className="text-2xl font-bold text-white">Sessão concluída!</h2>
          <p className="mt-2 text-slate-400">
            {sessionStats.correct} acertos · {sessionStats.wrong} erros
          </p>
          <div className="mt-4 inline-flex gap-2">
            <button
              type="button"
              onClick={() => setPhase('setup')}
              className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300 transition hover:bg-white/10"
            >
              Voltar
            </button>
            <button
              type="button"
              onClick={start}
              className="rounded-lg bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400"
            >
              Estudar de novo
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

interface FlashcardViewProps {
  item: { koi: Koi; side: KoiSide }
  revealed: boolean
  answered: boolean
  total: number
  done: number
  onReveal: () => void
  onAnswer: (correct: boolean) => void
  onNext: () => void
  onSkip: () => void
}

function FlashcardView({
  item,
  revealed,
  answered,
  total,
  done,
  onReveal,
  onAnswer,
  onNext,
}: FlashcardViewProps) {
  const { koi, side } = item
  const isPhotoToName = side === 'photo'

  // Foto→Nome: mostra só a foto até revelar. Nome→Foto: mostra só o nome até revelar.
  const showImage = isPhotoToName || revealed
  const showNameBlock = !isPhotoToName || revealed

  return (
    <div>
      <div className="mb-4 flex items-center justify-between text-sm text-slate-400">
        <span>
          Cartão {done + 1} de {total}
        </span>
        <span>{kiro(side)}</span>
      </div>

      <div className="overflow-hidden rounded-2xl border border-white/10 bg-slate-900">
        <div className="relative aspect-[4/3] w-full bg-slate-950">
          {showImage ? (
            <img
              src={koi.image}
              alt={isPhotoToName ? 'Foto do koi' : koi.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-2 px-6 text-center">
              <span className="text-4xl opacity-40" aria-hidden>
                🐟
              </span>
              <p className="text-sm text-slate-500">Foto oculta — adivinhe pela pista abaixo</p>
            </div>
          )}
        </div>
        <div className="p-6">
          {showNameBlock ? (
            <div className="text-center">
              {isPhotoToName && revealed && (
                <span className="text-xs tracking-wide text-slate-500 uppercase">Nome:</span>
              )}
              {!isPhotoToName && !revealed && (
                <p className="text-sm text-slate-400">Qual é a aparência desta variedade?</p>
              )}
              <h2 className={`text-3xl font-bold text-white ${!isPhotoToName && !revealed ? 'mt-2' : 'mt-1'}`}>
                {koi.name}
              </h2>
              {koi.nameJa && <div className="mt-1 text-sm text-slate-500">{koi.nameJa}</div>}
              {revealed && (
                <>
                  <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-slate-400">
                    {koi.description}
                  </p>
                  <div className="mt-3 flex flex-wrap justify-center gap-1.5">
                    {koi.colors.map((c) => (
                      <span
                        key={c}
                        className="rounded-full bg-white/5 px-2.5 py-0.5 text-xs text-slate-300"
                      >
                        {c}
                      </span>
                    ))}
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="py-6 text-center">
              <p className="text-sm text-slate-400">Qual é o nome desta variedade?</p>
            </div>
          )}

          {!revealed ? (
            <button
              type="button"
              onClick={onReveal}
              className="mt-4 w-full rounded-xl bg-white/10 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/15"
            >
              {isPhotoToName ? 'Revelar nome' : 'Revelar foto'}
            </button>
          ) : revealed && !answered ? (
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => onAnswer(true)}
                className="rounded-xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400"
              >
                Acertei
              </button>
              <button
                type="button"
                onClick={() => onAnswer(false)}
                className="rounded-xl bg-red-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-red-400"
              >
                Errei
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={onNext}
              className="mt-4 w-full rounded-xl bg-cyan-500 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400"
            >
              Próximo cartão
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function kiro(side: KoiSide): string {
  return side === 'photo' ? 'Foto → Nome' : 'Nome → Foto'
}