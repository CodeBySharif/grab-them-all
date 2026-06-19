import { useEstimation } from '../context/EstimationContext'
import { requestNotificationPermission } from '../hooks/usePriorityNotifications'
import { isIOS, isStandalonePwa } from '../utils/platform'

const providerHint: Record<'openrouteservice' | 'haversine', string> = {
  openrouteservice: 'Road route estimate',
  haversine: 'Approximate estimate',
}

function alertsHint(): string | null {
  if (isIOS() && !isStandalonePwa()) {
    return 'In Safari, in-app alerts still work. For push notifications, add to Home Screen first.'
  }

  return null
}

export function EstimationBanner() {
  const {
    state,
    travelDurationText,
    travelProvider,
    errorMessage,
    notificationPermission,
    requestLocation,
    refreshNotificationPermission,
  } = useEstimation()

  const hint = alertsHint()
  const showAlertsButton =
    state === 'ready' && notificationPermission === 'default'

  const enableAlerts = () => {
    void requestNotificationPermission().then(() => {
      refreshNotificationPermission()
    })
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
        {showAlertsButton && (
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-hairline pt-3">
            <p className="text-ink-muted">Step 2: enable push alerts</p>
            <button
              type="button"
              onClick={enableAlerts}
              className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-white hover:bg-primary-hover"
            >
              Enable Alerts
            </button>
          </div>
        )}
        {notificationPermission === 'granted' && (
          <p className="mt-2 text-xs text-semantic-success">Alerts enabled</p>
        )}
        {hint && showAlertsButton && (
          <p className="mt-2 text-xs text-ink-subtle">{hint}</p>
        )}
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
      <div className="mb-4 rounded-lg border border-hairline bg-surface-1 px-4 py-3 text-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-ink-subtle">{errorMessage}</p>
          <button
            type="button"
            onClick={requestLocation}
            className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-white hover:bg-primary-hover"
          >
            Enable Location
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="mb-4 rounded-lg border border-hairline bg-surface-1 px-4 py-3 text-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-ink-muted">
          Step 1: enable location for pickup/drop-off timing.
        </p>
        <button
          type="button"
          onClick={requestLocation}
          className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-white hover:bg-primary-hover"
        >
          Enable Location
        </button>
      </div>
      {hint && <p className="mt-2 text-xs text-ink-subtle">{hint}</p>}
    </div>
  )
}
