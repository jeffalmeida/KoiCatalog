import express from 'express'
import cors from 'cors'
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import multer from 'multer'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DATA_DIR = path.join(__dirname, '..', 'data')
const DATA_FILE = path.join(DATA_DIR, 'koi.json')
const UPLOAD_DIR = path.join(__dirname, '..', 'public', 'images', 'uploads')

const DEFAULT_KOIS = `{
  "kois": [
    {
      "id": "kohaku",
      "name": "Kohaku",
      "description": "O koi mais clássico e popular. Corpo branco com manchas vermelhas.",
      "image": "/images/koi/kohaku.jpg",
      "group": "Gosanke",
      "colors": ["branco", "vermelho"]
    }
  ]
}`

function loadKois() {
  try {
    const raw = readFileSync(DATA_FILE, 'utf-8')
    const parsed = JSON.parse(raw)
    if (parsed && Array.isArray(parsed.kois)) return parsed.kois
    console.warn('data/koi.json inválido, criando arquivo padrão')
  } catch (err) {
    console.warn('Não foi possível ler data/koi.json', err)
  }
  mkdirSync(DATA_DIR, { recursive: true })
  writeFileSync(DATA_FILE, DEFAULT_KOIS, 'utf-8')
  return JSON.parse(DEFAULT_KOIS).kois
}

function saveKois(kois) {
  mkdirSync(DATA_DIR, { recursive: true })
  writeFileSync(DATA_FILE, JSON.stringify({ kois }, null, 2), 'utf-8')
}

const app = express()
app.use(cors())
app.use(express.json({ limit: '10mb' }))

// Uploads gravados em runtime (public/images/uploads) — fora do dist/ do Vite.
mkdirSync(UPLOAD_DIR, { recursive: true })
app.use('/images/uploads', express.static(UPLOAD_DIR))

// Em produção, serve o frontend compilado (dist/) e tem fallback SPA.
// Em dev, o Vite serve o frontend e o Express fica só com a API.
const DIST_DIR = path.join(__dirname, '..', 'dist')
if (existsSync(DIST_DIR)) {
  app.use(express.static(DIST_DIR))
  app.get(/^\/(?!api|images).*/, (_req, res) => {
    res.sendFile(path.join(DIST_DIR, 'index.html'))
  })
}

// Upload de imagens (ajuste fino: extensões seguras, tamanho máx. 10MB)
const ALLOWED_EXT = ['.jpg', '.jpeg', '.png', '.webp', '.gif']
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase()
    const safeExt = ALLOWED_EXT.includes(ext) ? ext : '.jpg'
    const base = req.body?.koiId || 'koi'
    const name = `${base}-${Date.now()}${safeExt}`
    cb(null, name)
  },
})
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase()
    if (!ALLOWED_EXT.includes(ext)) {
      cb(new Error('Formato de imagem não suportado'))
      return
    }
    cb(null, true)
  },
})

// Listar variedades
app.get('/api/kois', (_req, res) => {
  res.json({ kois: loadKois() })
})

// Upload de imagem -> retorna a URL pública
app.post('/api/images', upload.single('image'), (req, res) => {
  if (!req.file) {
    res.status(400).json({ error: 'Nenhum arquivo enviado' })
    return
  }
  const url = `/images/uploads/${req.file.filename}`
  res.status(201).json({ url })
})

// Editar variedade (PATCH-like: aceita campos parciais)
app.put('/api/kois/:id', (req, res) => {
  const kois = loadKois()
  const idx = kois.findIndex((k) => k.id === req.params.id)
  if (idx === -1) {
    res.status(404).json({ error: 'não encontrado' })
    return
  }
  const body = req.body ?? {}
  const current = kois[idx]

  const name = body.name !== undefined ? String(body.name).trim() : current.name
  if (!name) {
    res.status(400).json({ error: 'name não pode ser vazio' })
    return
  }
  const description =
    body.description !== undefined ? String(body.description).trim() : current.description
  if (!description) {
    res.status(400).json({ error: 'description não pode ser vazio' })
    return
  }

  const updated = {
    ...current,
    name,
    nameJa:
      body.nameJa !== undefined
        ? String(body.nameJa).trim() || undefined
        : current.nameJa,
    description,
    image:
      body.image !== undefined
        ? String(body.image).trim() || current.image
        : current.image,
    group:
      body.group !== undefined ? String(body.group).trim() || 'Outros' : current.group,
    colors:
      body.colors !== undefined
        ? Array.isArray(body.colors)
          ? body.colors.map((c) => String(c).trim()).filter(Boolean)
          : []
        : current.colors,
  }
  kois[idx] = updated
  saveKois(kois)
  res.json(updated)
})

// Criar variedade
app.post('/api/kois', (req, res) => {
  const body = req.body ?? {}
  const name = String(body.name ?? '').trim()
  const description = String(body.description ?? '').trim()
  if (!name || !description) {
    res.status(400).json({ error: 'name e description são obrigatórios' })
    return
  }
  const kois = loadKois()
  const slug = (s) =>
    s
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
  let id = slug(name)
  let n = 2
  while (kois.some((k) => k.id === id)) id = `${slug(name)}-${n++}`

  const koi = {
    id,
    name,
    nameJa: body.nameJa ? String(body.nameJa).trim() || undefined : undefined,
    description,
    image: String(body.image ?? '').trim() || '/images/koi/kohaku.jpg',
    group: String(body.group ?? 'Outros').trim() || 'Outros',
    colors: Array.isArray(body.colors) ? body.colors.map((c) => String(c).trim()).filter(Boolean) : [],
  }
  kois.push(koi)
  saveKois(kois)
  res.status(201).json(koi)
})

// Remover variedade
app.delete('/api/kois/:id', (req, res) => {
  const kois = loadKois()
  const next = kois.filter((k) => k.id !== req.params.id)
  if (next.length === kois.length) {
    res.status(404).json({ error: 'não encontrado' })
    return
  }
  saveKois(next)
  res.status(204).end()
})

const PORT = Number(process.env.PORT ?? 3001)
app.listen(PORT, () => {
  console.log(`API koi rodando em http://localhost:${PORT}`)
})