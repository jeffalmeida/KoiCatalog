import { useEffect, useState } from 'react'
import { CatalogProvider } from './CatalogProvider.tsx'
import { AuthScreen } from './components/AuthScreen.tsx'
import { FishForm } from './components/FishForm.tsx'
import { InventoryView } from './components/InventoryView.tsx'
import { SettingsView } from './components/SettingsView.tsx'
import { isSupabaseConfigured, supabase } from './lib/supabase.ts'
import { StatusScreen } from './StatusScreen.tsx'
import { useRoute } from './useRoute.ts'

export default function App() {
  const configured = isSupabaseConfigured
  const [email, setEmail] = useState<string | null>(null)
  const [ready, setReady] = useState(!configured)

  useEffect(() => {
    if (!configured || !supabase) return
    let active = true
    void supabase.auth.getSession().then(({ data }) => {
      if (!active) return
      setEmail(data.session?.user.email ?? null)
      setReady(true)
    })
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setEmail(session?.user.email ?? null)
      setReady(true)
    })
    return () => {
      active = false
      data.subscription.unsubscribe()
    }
  }, [configured])

  if (!ready) return <StatusScreen title="Abrindo o inventário…" />
  if (configured && !email) return <AuthScreen />

  return (
    <CatalogProvider email={email}>
      <Shell />
    </CatalogProvider>
  )
}

function Shell() {
  const route = useRoute()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [route])

  return (
    <div className="mx-auto min-h-dvh w-full max-w-lg px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))]">
      {route.name === 'inventory' ? <InventoryView /> : null}
      {route.name === 'settings' ? <SettingsView /> : null}
      {route.name === 'new' ? <FishForm key="new" /> : null}
      {route.name === 'edit' ? <FishForm key={route.id} fishId={route.id} /> : null}
    </div>
  )
}
