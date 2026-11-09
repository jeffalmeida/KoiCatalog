import { navigate } from '../route.ts'
import { textButtonClass } from '../styles.ts'

export function BackButton() {
  return (
    <button type="button" className={textButtonClass} onClick={() => navigate('#/')}>
      ← Voltar
    </button>
  )
}
