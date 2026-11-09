import { createContext, useContext } from 'react'

export interface AppToast {
  id: number
  message: string
}

interface ToastContextValue {
  show: (message: string) => void
}

export const ToastContext = createContext<ToastContextValue | null>(null)

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast deve ser usado dentro de <ToastProvider>')
  return ctx
}