import { useEffect, useRef, useState } from 'react'
import type { Koi } from '../types'
import { useKoiCatalog, KoiCatalogError, type AddKoiInput, DEFAULT_IMAGE } from '../hooks/useKoiCatalog'
import { useToast } from '../components/toastContext'
import { koiImageSrc } from '../lib/koiImageSrc'

const GROUP_OPTIONS = [
  'Gosanke',
  'Utsurimono',
  'Hikarimono',
  'Kawarimono',
  'Doitsu',
  'Outros',
]

interface KoiFormProps {
  /** Quando definido, o formulário edita a variedade em vez de criar nova. */
  initial?: Koi | null
  onSaved?: (koi: Koi) => void
  onCancel?: () => void
}

/**
 * Formulário de adicionar/editar variedade. Faz upload da imagem para o servidor
 * (ou envia base64 quando a API não está disponível) e persiste via useKoiCatalog.
 */
export function KoiForm({ initial, onSaved, onCancel }: KoiFormProps) {
  const isEdit = Boolean(initial)
  const { addKoi, updateKoi, uploadImage, usingApi } = useKoiCatalog()
  const toast = useToast()

  const [name, setName] = useState(initial?.name ?? '')
  const [nameJa, setNameJa] = useState(initial?.nameJa ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [group, setGroup] = useState(initial?.group ?? 'Gosanke')
  const [colorsText, setColorsText] = useState(initial?.colors?.join(', ') ?? '')
  /** Caminho salvo no catálogo (ou vazio se o usuário removeu). */
  const [storedImage, setStoredImage] = useState(initial?.image ?? '')
  const [previewSrc, setPreviewSrc] = useState<string | undefined>(() =>
    koiImageSrc(initial?.image),
  )
  const [previewFailed, setPreviewFailed] = useState(false)
  const [imageName, setImageName] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const fileRef = useRef<HTMLInputElement>(null)
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const previewBlobRef = useRef<string | null>(null)

  useEffect(() => {
    return () => {
      if (previewBlobRef.current) URL.revokeObjectURL(previewBlobRef.current)
    }
  }, [])

  function revokePreviewBlob() {
    if (previewBlobRef.current) {
      URL.revokeObjectURL(previewBlobRef.current)
      previewBlobRef.current = null
    }
  }

  function handleFile(file: File | undefined) {
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setError('O arquivo precisa ser uma imagem (JPG, PNG, WebP…).')
      return
    }
    revokePreviewBlob()
    const objectUrl = URL.createObjectURL(file)
    previewBlobRef.current = objectUrl
    setPreviewSrc(objectUrl)
    setPreviewFailed(false)
    setImageName(file.name)
    setPendingFile(file)
    setError('')
  }

  function removeImage() {
    revokePreviewBlob()
    setStoredImage('')
    setPreviewSrc(undefined)
    setPreviewFailed(false)
    setImageName('')
    setPendingFile(null)
    if (fileRef.current) fileRef.current.value = ''
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      const colors = colorsText
        .split(',')
        .map((c) => c.trim())
        .filter(Boolean)

      let finalImage = storedImage.trim()

      if (pendingFile && !usingApi) {
        throw new KoiCatalogError(
          'Para gravar a foto no disco, rode npm run dev (API + Vite). Só o Vite não grava arquivos em public/images/uploads/.',
        )
      }

      // Se o usuário escolheu um arquivo E a API está disponível, faz upload real.
      if (pendingFile && usingApi) {
        finalImage = await uploadImage(pendingFile)
        revokePreviewBlob()
        setPendingFile(null)
        setStoredImage(finalImage)
        setPreviewSrc(koiImageSrc(finalImage))
        setPreviewFailed(false)
        setImageName('')
      }

      const imageToSend = finalImage || DEFAULT_IMAGE

      const input: AddKoiInput = {
        name,
        nameJa,
        description,
        group,
        colors,
        image: imageToSend,
      }

      if (isEdit && initial) {
        const updated = await updateKoi(initial.id, input)
        const savedImage =
          updated.image.startsWith('/images/uploads/')
            ? ` Foto em public${updated.image}.`
            : ''
        toast.show(`"${updated.name}" atualizado!${savedImage}`)
        onSaved?.(updated)
      } else {
        const created = await addKoi(input)
        const savedImage =
          created.image.startsWith('/images/uploads/')
            ? ` Foto em public${created.image}.`
            : ''
        toast.show(`"${created.name}" adicionado ao catálogo!${savedImage}`)
        onSaved?.(created)
      }
    } catch (err) {
      if (err instanceof KoiCatalogError) {
        setError(err.message)
      } else {
        setError('Erro inesperado ao salvar.')
      }
    } finally {
      setSaving(false)
    }
  }

  const inputClass =
    'w-full rounded-lg border border-white/10 bg-slate-900 px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-cyan-500/50'

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="mb-1.5 block text-xs font-medium tracking-wide text-slate-500 uppercase">
          Nome *
        </label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ex.: Kohaku, Shiro Utsuri…"
          className={inputClass}
          required
        />
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-medium tracking-wide text-slate-500 uppercase">
          Nome em japonês (opcional)
        </label>
        <input
          value={nameJa}
          onChange={(e) => setNameJa(e.target.value)}
          placeholder="Ex.: 紅白"
          className={inputClass}
        />
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-medium tracking-wide text-slate-500 uppercase">
          Descrição *
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Como identificar esta variedade? Quais as cores e padrões?"
          rows={4}
          className={inputClass}
          required
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-xs font-medium tracking-wide text-slate-500 uppercase">
            Grupo
          </label>
          <select value={group} onChange={(e) => setGroup(e.target.value)} className={inputClass}>
            {GROUP_OPTIONS.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium tracking-wide text-slate-500 uppercase">
            Cores (separadas por vírgula)
          </label>
          <input
            value={colorsText}
            onChange={(e) => setColorsText(e.target.value)}
            placeholder="Ex.: branco, vermelho"
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-medium tracking-wide text-slate-500 uppercase">
          Foto
        </label>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-slate-300 transition hover:bg-white/10"
          >
            Escolher arquivo…
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            onChange={(e) => handleFile(e.target.files?.[0])}
            className="hidden"
          />
          {previewSrc && !previewFailed ? (
            <div className="flex items-center gap-2">
              <img
                src={previewSrc}
                alt="Pré-visualização"
                className="h-12 w-16 rounded-lg object-cover bg-slate-800"
                onError={() => setPreviewFailed(true)}
              />
              <span className="truncate text-xs text-slate-400">{imageName || 'imagem atual'}</span>
            </div>
          ) : previewSrc && previewFailed ? (
            <div className="flex items-center gap-2">
              <div className="flex h-12 w-16 items-center justify-center rounded-lg border border-dashed border-white/15 bg-slate-800 text-[10px] leading-tight text-slate-500">
                Sem foto
              </div>
              <span className="text-xs text-slate-500">
                {imageName || 'Arquivo atual indisponível — escolha uma nova foto'}
              </span>
            </div>
          ) : (
            <span className="text-xs text-slate-500">Nenhum arquivo selecionado</span>
          )}
        </div>
        {(previewSrc || storedImage || pendingFile) && (
          <button
            type="button"
            onClick={removeImage}
            className="mt-2 text-xs text-slate-500 underline hover:text-slate-300"
          >
            Remover imagem
          </button>
        )}
      </div>

      {error && (
        <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm text-red-300">
          {error}
        </p>
      )}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={saving}
          className="w-full rounded-xl bg-cyan-500 px-4 py-3 text-base font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? 'Salvando…' : isEdit ? 'Salvar alterações' : 'Adicionar variedade'}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={saving}
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-base font-semibold text-slate-300 transition hover:bg-white/10 disabled:opacity-50"
          >
            Cancelar
          </button>
        )}
      </div>
    </form>
  )
}