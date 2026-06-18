import { useEstimation } from '../context/EstimationContext'
import { requestNotificationPermission } from '../hooks/usePriorityNotifications'

const providerHint: Record<'openrouteservice' | 'haversine', string> = {
  openrouteservice: 'Road route estimate',
  haversine: 'Approximate estimate',
}

export function EstimationBanner() {
  const {
    state,
    travelDurationText,
    travelProvider,
    errorMessage,
    requestLocation,
  } = useEstimation()

  const enableLocationAndAlerts = () => {
    requestLocation()
    void requestNotificationPermission()
  }

  if (state === 'ready') {
    return (
      <div className="mb-4 rounded-lg border border-hairline bg-surface-1 px-4 py-3 text-sm">
        <p className="text-ink-muted">
          Drive to Langkawi terminal:{' '}
          <span className="font-medium text-ink">{travelDurationText}</span>
          {travelProvider && (
            <span className="text-ink-subtle">
              {' '}
              ({providerHint[travelProvider]})
            </span>
          )}
        </p>
        <p className="mt-1 text-xs text-ink-subtle">
          Inbound: ferry arrival window · Outbound: be around terminal 1 hr
          before departure · Priority alerts when time is approaching
        </p>
      </div>
    )
  }

  if (state === 'locating' || state === 'loading') {
    return (
      <div className="mb-4 rounded-lg border border-hairline bg-surface-1 px-4 py-3 text-sm text-ink-muted">
        {state === 'locating'
          ? 'Getting your location…'
          : 'Calculating drive time to ferry terminal…'}
      </div>
    )
  }

  if (state === 'denied' || state === 'error') {
    return (
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-hairline bg-surface-1 px-4 py-3 text-sm">
        <p className="text-ink-subtle">{errorMessage}</p>
        <button
          type="button"
          onClick={enableLocationAndAlerts}
          className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-white hover:bg-primary-hover"
        >
          Enable Location and Alerts
        </button>
      </div>
    )
  }

  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-hairline bg-surface-1 px-4 py-3 text-sm">
      <p className="text-ink-muted">
        Enable location for pickup/drop-off timing and priority alerts.
      </p>
      <button
        type="button"
        onClick={enableLocationAndAlerts}
        className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-white hover:bg-primary-hover"
      >
        Enable Location and Alerts
      </button>
    </div>
  )
}
