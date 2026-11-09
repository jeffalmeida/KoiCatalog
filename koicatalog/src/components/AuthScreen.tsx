import { useState, type FormEvent } from 'react'
import { supabase } from '../lib/supabase.ts'
import { fieldClass, primaryButtonClass, textButtonClass } from '../styles.ts'

function authError(message: string): string {
  const text = message.toLowerCase()
  if (text.includes('invalid login') || text.includes('invalid credentials')) return 'E-mail ou senha incorretos.'
  if (text.includes('already registered') || text.includes('already been registered')) {
    return 'Esta conta já existe. Entre com a senha.'
  }
  if (text.includes('password')) return 'A senha precisa ter pelo menos 6 caracteres.'
  if (text.includes('email') || text.includes('invalid')) return 'Use um e-mail válido.'
  return 'Não foi possível entrar. Tente de novo.'
}

export function AuthScreen() {
  const [mode, setMode] = useState<'sign-in' | 'sign-up'>('sign-in')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    if (!supabase || busy) return
    setBusy(true)
    setError(null)
    setInfo(null)
    const address = email.trim().toLowerCase()
    try {
      if (mode === 'sign-in') {
        const { error: signError } = await supabase.auth.signInWithPassword({ email: address, password })
        if (signError) setError(authError(signError.message))
      } else {
        const { data, error: signError } = await supabase.auth.signUp({ email: address, password })
        if (signError) setError(authError(signError.message))
        else if (!data.session) setInfo('Conta criada. Confirme o e-mail e depois entre.')
      }
    } catch {
      setError('Não foi possível entrar. Tente de novo.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="grid min-h-dvh place-items-center bg-paper px-4 py-8">
      <form className="w-full max-w-sm" onSubmit={(event) => void onSubmit(event)}>
        <p className="text-sm tracking-[0.16em] text-muted uppercase">Lago</p>
        <h1 className="mt-1 font-display text-4xl text-pond">Inventário de carpas</h1>
        <p className="mt-2 text-sm text-muted">Entre para ver as mesmas carpas no celular e no computador.</p>
        <label className="mt-6 block text-sm font-medium" htmlFor="email">
          E-mail
        </label>
        <input
          id="email"
          type="email"
          required
          autoComplete="username"
          autoCapitalize="none"
          className={`${fieldClass} mt-2`}
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
        <label className="mt-4 block text-sm font-medium" htmlFor="password">
          Senha
        </label>
        <input
          id="password"
          type="password"
          required
          minLength={6}
          autoComplete={mode === 'sign-in' ? 'current-password' : 'new-password'}
          className={`${fieldClass} mt-2`}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
        {error ? (
          <p className="mt-3 text-sm text-danger" role="alert">
            {error}
          </p>
        ) : null}
        {info ? (
          <p className="mt-3 text-sm text-pond" role="status">
            {info}
          </p>
        ) : null}
        <button type="submit" className={`${primaryButtonClass} mt-5`} disabled={busy}>
          {busy ? 'Aguarde…' : mode === 'sign-in' ? 'Entrar' : 'Criar conta'}
        </button>
        <button
          type="button"
          className={`${textButtonClass} mt-2 w-full`}
          onClick={() => {
            setMode(mode === 'sign-in' ? 'sign-up' : 'sign-in')
            setError(null)
            setInfo(null)
          }}
        >
          {mode === 'sign-in' ? 'Criar conta' : 'Já tenho conta'}
        </button>
      </form>
    </div>
  )
}
