import { useId, type KeyboardEvent } from 'react'
import { motifFins, motifLayers, type MotifPaint } from '../koiMotifs.ts'
import type { Region } from '../types.ts'

const BODY =
  'M160 28C128 30 104 62 98 100C92 145 84 185 84 230C84 280 98 325 118 362C132 388 146 406 154 418C157 424 160 428 160 428C163 424 166 418 172 406C188 388 202 362 216 325C236 280 236 230 236 185C236 145 228 100 222 62C216 30 192 28 160 28Z'
const TAIL =
  'M146 400C132 432 96 468 78 492C98 484 122 476 142 470C150 466 156 472 160 480C164 472 170 466 178 470C198 476 222 484 242 492C224 468 188 432 174 400Z'
const TAIL_L = 'M146 400C132 432 96 468 78 492C98 484 122 476 142 470C150 466 156 472 160 480L160 400Z'
const TAIL_R = 'M174 400L160 480C164 472 170 466 178 470C198 476 222 484 242 492C224 468 188 432 174 400Z'
const LONG_TAIL =
  'M146 398C128 444 86 500 62 540C90 524 118 512 142 504C152 500 156 508 160 518C164 508 168 500 178 504C202 512 230 524 258 540C234 500 192 444 174 398Z'
const PECTORAL_L = 'M96 148C62 158 40 190 46 232C64 224 88 196 112 170C106 156 100 150 96 148Z'
const PECTORAL_R = 'M224 148C258 158 280 190 274 232C256 224 232 196 208 170C214 156 220 150 224 148Z'
const LONG_PECTORAL_L = 'M96 146C52 164 28 220 34 310C58 286 86 236 118 186C108 164 100 152 96 146Z'
const LONG_PECTORAL_R = 'M224 146C268 164 292 220 286 310C262 286 234 236 202 186C212 164 220 152 224 146Z'
const PELVIC_L = 'M112 268C92 278 84 304 98 314C114 306 132 286 134 272C128 266 120 264 112 268Z'
const PELVIC_R = 'M208 268C228 278 236 304 222 314C206 306 188 286 186 272C192 266 200 264 208 268Z'
const HEAD_MARK = 'M160 58C148 58 140 70 140 82C140 96 148 106 160 106C172 106 180 96 180 82C180 70 172 58 160 58Z'
const DORSAL_MARK = 'M142 150C134 190 132 240 144 290C154 320 166 320 176 290C188 240 186 190 178 150C168 136 152 136 142 150Z'

type KoiSvgProps = {
  bodyColor: string
  headColor?: string | null
  dorsalColor?: string | null
  motif?: string | null
  selected?: Region | null
  onSelect?: (region: Region) => void
  decorative?: boolean
  className?: string
}

function Filled({ d, fill }: { d: string; fill: string }) {
  return <path d={d} fill={fill} stroke="#2c241c" strokeWidth={1} strokeLinejoin="round" strokeLinecap="round" />
}

function Outline({ d }: { d: string }) {
  return <path d={d} fill="none" stroke="#14343c" strokeWidth={1.4} strokeDasharray="5 4" strokeLinejoin="round" />
}

function HitPath({
  d,
  label,
  pressed,
  onPress,
  hidden,
}: {
  d: string
  label?: string
  pressed?: boolean
  onPress: () => void
  hidden?: boolean
}) {
  function onKeyDown(event: KeyboardEvent<SVGPathElement>) {
    if (hidden) return
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      onPress()
    }
  }

  return (
    <path
      d={d}
      fill="transparent"
      className="cursor-pointer"
      role={hidden ? undefined : 'button'}
      tabIndex={hidden ? undefined : 0}
      aria-hidden={hidden ? true : undefined}
      aria-label={hidden ? undefined : label}
      aria-pressed={hidden ? undefined : pressed}
      onClick={onPress}
      onKeyDown={onKeyDown}
    />
  )
}

function Fins({
  bodyColor,
  rightColor,
  long,
}: {
  bodyColor: string
  rightColor: string
  long: boolean
}) {
  return (
    <>
      {long ? (
        <Filled d={LONG_TAIL} fill={bodyColor} />
      ) : rightColor === bodyColor ? (
        <Filled d={TAIL} fill={bodyColor} />
      ) : (
        <>
          <Filled d={TAIL_L} fill={bodyColor} />
          <Filled d={TAIL_R} fill={rightColor} />
        </>
      )}
      <Filled d={long ? LONG_PECTORAL_L : PECTORAL_L} fill={bodyColor} />
      <Filled d={long ? LONG_PECTORAL_R : PECTORAL_R} fill={rightColor} />
      <Filled d={PELVIC_L} fill={bodyColor} />
      <Filled d={PELVIC_R} fill={rightColor} />
    </>
  )
}

export function KoiSvg({
  bodyColor,
  headColor = null,
  dorsalColor = null,
  motif = null,
  selected = null,
  onSelect,
  decorative = false,
  className,
}: KoiSvgProps) {
  const rawId = useId()
  const clipId = `koi-${rawId.replace(/:/g, '')}`
  const interactive = Boolean(onSelect)
  const paint: MotifPaint = { body: bodyColor, head: headColor, dorsal: dorsalColor }
  const layers = motifLayers(motif, paint)
  const useMotif = layers !== null
  const long = motifFins(motif) === 'long'
  const split = motifFins(motif) === 'split'
  const rightColor = split && headColor ? headColor : bodyColor

  return (
    <svg
      viewBox="16 0 288 560"
      className={['block h-auto w-full overflow-visible', className].filter(Boolean).join(' ')}
      role={decorative || interactive ? undefined : 'img'}
      aria-label={decorative || interactive ? undefined : 'Desenho da carpa'}
      aria-hidden={decorative ? true : undefined}
    >
      <defs>
        <clipPath id={clipId}>
          <path d={BODY} />
        </clipPath>
      </defs>
      <g pointerEvents="none">
        <Fins bodyColor={bodyColor} rightColor={rightColor} long={long} />
        <Filled d={BODY} fill={bodyColor} />
        {selected === 'body' ? <Outline d={BODY} /> : null}
        {selected === 'body' ? <Fins bodyColor={bodyColor} rightColor={rightColor} long={long} /> : null}
        <g clipPath={`url(#${clipId})`}>
          {useMotif
            ? layers.map((layer, index) => (
                <path
                  key={`${layer.d}-${index}`}
                  d={layer.d}
                  fill={layer.fill ?? 'none'}
                  stroke={layer.stroke}
                  strokeOpacity={layer.opacity}
                  strokeWidth={layer.stroke ? 1.2 : undefined}
                  fillOpacity={layer.opacity}
                  strokeLinecap="round"
                />
              ))
            : null}
          {!useMotif && dorsalColor ? <path d={DORSAL_MARK} fill={dorsalColor} /> : null}
          {!useMotif && headColor ? <path d={HEAD_MARK} fill={headColor} /> : null}
          {selected === 'dorsal' ? <Outline d={DORSAL_MARK} /> : null}
          {selected === 'head' ? <Outline d={HEAD_MARK} /> : null}
        </g>
        <circle cx="136" cy="86" r="3.4" fill="#f7f4ee" />
        <circle cx="136" cy="86" r="1.7" fill="#1c1c1c" />
        <circle cx="184" cy="86" r="3.4" fill="#f7f4ee" />
        <circle cx="184" cy="86" r="1.7" fill="#1c1c1c" />
      </g>
      {onSelect ? (
        <g>
          <HitPath d={long ? LONG_TAIL : TAIL} hidden onPress={() => onSelect('body')} />
          <HitPath d={long ? LONG_PECTORAL_L : PECTORAL_L} hidden onPress={() => onSelect('body')} />
          <HitPath d={long ? LONG_PECTORAL_R : PECTORAL_R} hidden onPress={() => onSelect('body')} />
          <HitPath d={PELVIC_L} hidden onPress={() => onSelect('body')} />
          <HitPath d={PELVIC_R} hidden onPress={() => onSelect('body')} />
          <HitPath d={BODY} label="Cor predominante" pressed={selected === 'body'} onPress={() => onSelect('body')} />
          <HitPath d={DORSAL_MARK} label="Mancha dorsal" pressed={selected === 'dorsal'} onPress={() => onSelect('dorsal')} />
          <HitPath
            d={HEAD_MARK}
            label="Mancha próxima da cabeça"
            pressed={selected === 'head'}
            onPress={() => onSelect('head')}
          />
        </g>
      ) : null}
    </svg>
  )
}
