import { KoiForm } from '../components/KoiForm'

export function AddKoiPage({ onAdded }: { onAdded?: (id: string) => void }) {
  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-3xl font-bold text-white">Nova variedade</h1>
      <p className="mt-1 text-sm text-slate-400">Adicione um koi ao seu catálogo pessoal.</p>

      <div className="mt-6">
        <KoiForm onSaved={(koi) => onAdded?.(koi.id)} />
      </div>
    </div>
  )
}