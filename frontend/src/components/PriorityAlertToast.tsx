import type { PriorityTripAlert } from '../utils/priorityAlerts'

interface PriorityAlertToastProps {
  alerts: PriorityTripAlert[]
  onDismiss: (id: string) => void
}

export function PriorityAlertToast({
  alerts,
  onDismiss,
}: PriorityAlertToastProps) {
  if (alerts.length === 0) {
    return null
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-[100] flex flex-col gap-2 p-4 pb-[max(1rem,env(safe-area-inset-bottom,0px))] pl-[max(1rem,env(safe-area-inset-left,0px))] pr-[max(1rem,env(safe-area-inset-right,0px))]">
      {alerts.slice(0, 3).map((alert) => (
        <div
          key={alert.id}
          className={[
            'flex items-start gap-3 rounded-lg border px-4 py-3 shadow-lg backdrop-blur-sm',
            alert.priority === 'urgent'
              ? 'border-red-500/40 bg-[#1a0f0f]/95'
              : 'border-primary/40 bg-surface-1/95',
          ].join(' ')}
          role="alert"
        >
          <span
            className={[
              'mt-1.5 h-2 w-2 shrink-0 rounded-full',
              alert.priority === 'urgent'
                ? 'animate-pulse bg-red-500'
                : 'bg-primary',
            ].join(' ')}
          />
          <div className="min-w-0 flex-1">
            <p
              className={[
                'text-xs font-semibold uppercase tracking-wide',
                alert.priority === 'urgent' ? 'text-red-400' : 'text-primary',
              ].join(' ')}
            >
              {alert.priority === 'urgent' ? 'Leave now' : 'Approaching'}
            </p>
            <p className="mt-0.5 text-sm font-medium text-ink">
              {alert.message}
            </p>
            <p className="mt-1 text-xs text-ink-subtle">
              {alert.departureTime} · {alert.vesselName}
            </p>
          </div>
          <button
            type="button"
            onClick={() => onDismiss(alert.id)}
            className="shrink-0 text-xs text-ink-subtle hover:text-ink"
            aria-label="Dismiss alert"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  )
}
