import { primaryButtonClass } from './styles.ts'

export function StatusScreen({
  title,
  action,
}: {
  title: string
  action?: { label: string; onClick: () => void }
}) {
  return (
    <div className="grid min-h-dvh place-items-center bg-paper px-6 text-center text-pond">
      <div className="max-w-sm">
        <p className="font-display text-3xl">{title}</p>
        {action ? (
          <button type="button" className={`${primaryButtonClass} mt-6`} onClick={action.onClick}>
            {action.label}
          </button>
        ) : null}
      </div>
    </div>
  )
}
