import { useEffect, useRef } from 'react'
import type { PriorityTripAlert } from '../utils/priorityAlerts'
import { canSendBrowserNotifications } from '../utils/platform'

export function usePriorityNotifications(
  alerts: PriorityTripAlert[],
  enabled: boolean,
) {
  const notifiedRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    if (!enabled || alerts.length === 0) {
      return
    }

    if (!canSendBrowserNotifications()) {
      return
    }

    for (const alert of alerts) {
      if (alert.priority !== 'urgent') {
        continue
      }

      if (notifiedRef.current.has(alert.id)) {
        continue
      }

      notifiedRef.current.add(alert.id)

      try {
        new Notification('Ferry priority trip', {
          body: alert.message,
          tag: alert.id,
        })
      } catch {
        // Notifications unsupported in this context
      }
    }
  }, [alerts, enabled])
}

/** Must be called directly from a user click/tap (not setTimeout). */
export async function requestNotificationPermission(): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return false
  }

  if (Notification.permission === 'granted') {
    return true
  }

  if (Notification.permission === 'denied') {
    return false
  }

  try {
    const result = await Notification.requestPermission()
    return result === 'granted'
  } catch {
    return false
  }
}
