export type MotifPaint = {
  body: string
  head: string | null
  dorsal: string | null
}

export type MotifLayer = {
  d: string
  fill?: string
  stroke?: string
  opacity?: number
}

const KOHAKU = [
  'M108 64C142 44 188 62 184 118C178 168 140 188 114 158C88 128 82 84 108 64Z',
  'M150 214C184 200 198 246 180 286C160 316 134 288 136 244C138 220 134 216 150 214Z',
]
const SUMI = [circle(148, 188, 5.5), circle(184, 236, 4.5), circle(132, 268, 4), circle(176, 160, 3.5)]
const SHOWA_WHITE = [
  'M86 176C124 148 152 188 136 242C112 274 72 236 86 176Z',
  'M186 228C228 206 248 268 218 314C184 336 166 270 186 228Z',
  'M118 330C156 314 176 352 158 386C136 406 104 378 118 330Z',
]
const SHOWA_RED = [
  'M124 58C156 42 198 64 196 104C194 136 156 148 132 124C112 104 108 74 124 58Z',
  'M150 200C186 186 206 230 186 268C162 292 136 250 150 200Z',
]
const ASAGI_RED = [
  'M96 118C124 96 146 124 134 160C116 180 84 158 96 118Z',
  'M224 118C196 96 174 124 186 160C204 180 236 158 224 118Z',
  'M108 210C132 196 148 224 132 248C112 262 92 236 108 210Z',
  'M212 210C188 196 172 224 188 248C208 262 228 236 212 210Z',
]
const YELLOW_PATCHES = [
  'M126 78C158 56 198 78 190 118C178 146 136 140 126 78Z',
  'M154 210C196 196 214 246 190 286C164 308 140 250 154 210Z',
  'M112 320C146 304 168 342 148 374C126 392 100 356 112 320Z',
]

function circle(cx: number, cy: number, r: number) {
  return `M${cx - r} ${cy}A${r} ${r} 0 1 0 ${cx + r} ${cy}A${r} ${r} 0 1 0 ${cx - r} ${cy}Z`
}

function scaleArcs(rows: number, startY: number): string[] {
  const arcs: string[] = []
  for (let row = 0; row < rows; row += 1) {
    const y = startY + row * 30
    const shift = row % 2 ? 14 : 0
    for (let x = 104 + shift; x <= 216; x += 28) {
      arcs.push(`M${x - 9} ${y}C${x - 10} ${y + 11},${x + 10} ${y + 11},${x + 9} ${y}`)
    }
  }
  return arcs
}

function dots(rows: number, startY: number, radius: number): string[] {
  const marks: string[] = []
  for (let row = 0; row < rows; row += 1) {
    const y = startY + row * 34
    const shift = row % 2 ? 16 : 0
    for (let x = 112 + shift; x <= 208; x += 32) marks.push(circle(x, y, radius))
  }
  return marks
}

function keyOf(name: string) {
  return name.trim().toLocaleLowerCase('pt-BR')
}

function fills(paths: string[], fill: string | null, opacity?: number): MotifLayer[] {
  if (!fill) return []
  return paths.map((d) => ({ d, fill, opacity }))
}

function strokes(paths: string[], stroke: string, opacity: number): MotifLayer[] {
  return paths.map((d) => ({ d, stroke, opacity }))
}

export function motifFins(name: string | null | undefined): 'long' | 'split' | 'body' {
  const key = keyOf(name ?? '')
  if (key === 'hirenaga') return 'long'
  if (key === 'hariwake') return 'split'
  return 'body'
}

export function motifLayers(name: string | null | undefined, paint: MotifPaint): MotifLayer[] | null {
  const key = keyOf(name ?? '')
  if (!key) return null
  const { head, dorsal } = paint
  const ink = '#241c16'
  const blue = '#24506a'

  switch (key) {
    case 'kohaku':
      return fills(KOHAKU, head)
    case 'sanke':
      return [...fills(KOHAKU, head), ...fills(SUMI, dorsal)]
    case 'showa':
      return [...fills(SHOWA_WHITE, dorsal), ...fills(SHOWA_RED, head)]
    case 'tancho':
      return fills([circle(160, 70, 14)], head)
    case 'kujaku':
      return [...fills(KOHAKU, head), ...strokes(scaleArcs(7, 150), ink, 0.45), ...fills(SUMI.slice(0, 3), dorsal)]
    case 'asagi':
      return [...fills(ASAGI_RED, head), ...strokes(scaleArcs(8, 140), blue, 0.55)]
    case 'shusui':
      return [
        ...fills(ASAGI_RED, head),
        ...strokes(scaleArcs(8, 140), blue, 0.4),
        { d: 'M148 78C156 150 150 250 146 390L174 390C170 250 176 150 172 78Z', fill: dorsal ?? ink },
      ]
    case 'goromo':
      return [...fills(KOHAKU, head), ...strokes(scaleArcs(7, 150), ink, 0.55)]
    case 'goshiki':
      return [...fills(KOHAKU, head), ...fills(SUMI, dorsal), ...fills(dots(4, 170, 3.5), blue, 0.9)]
    case 'matsuba':
      return fills(dots(7, 150, 4.5), dorsal ?? ink)
    case 'chagoi':
    case 'soragoi':
    case 'benigoi':
    case 'platinum ogon':
    case 'yamabuki ogon':
      return []
    case 'ochiba':
      return fills(YELLOW_PATCHES, head)
    case 'hariwake':
      return [{ d: 'M160 20H300V560H160Z', fill: head ?? paint.body }]
    case 'shiro utsuri':
      return fills([...SHOWA_WHITE, 'M128 70C168 48 206 78 196 120C180 150 132 140 128 70Z'], head ?? dorsal)
    case 'hi utsuri':
      return fills([...SHOWA_RED, SHOWA_WHITE[1]], head)
    case 'kin ki utsuri':
      return fills([...YELLOW_PATCHES, SHOWA_WHITE[0]], head)
    case 'kumonryu':
      return fills(
        [
          'M118 70C170 48 210 100 188 160C160 190 100 150 118 70Z',
          'M96 210C150 180 176 250 140 310C100 340 70 260 96 210Z',
          'M176 250C230 230 240 310 200 350C164 372 150 290 176 250Z',
        ],
        dorsal,
      )
    case 'kikokuryu':
      return [
        ...fills(
          ['M118 70C170 48 210 100 188 160C160 190 100 150 118 70Z', 'M96 220C146 196 168 260 136 308C100 332 74 268 96 220Z'],
          dorsal,
        ),
        ...fills(['M170 180C214 166 230 220 206 262C176 286 154 220 170 180Z'], head),
      ]
    case 'kin kikokuryu':
      return fills(
        ['M120 80C168 56 208 110 184 168C154 198 104 156 120 80Z', 'M100 230C148 200 170 270 138 318C102 344 76 280 100 230Z'],
        dorsal,
      )
    case 'kikusui':
      return fills(YELLOW_PATCHES, head)
    case 'bekko':
      return fills(SUMI, dorsal)
    case 'hirenaga':
      return [...fills(SHOWA_WHITE, head), ...fills([SHOWA_RED[1]], dorsal)]
    default:
      return null
  }
}
