import { useEffect, useRef } from 'react'
import type { PriorityTripAlert } from '../utils/priorityAlerts'
import { canUseWebNotifications } from '../utils/platform'

const NOTIFICATION_PROMPT_DELAY_MS = 1000

export function usePriorityNotifications(
  alerts: PriorityTripAlert[],
  enabled: boolean,
) {
  const notifiedRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    if (!enabled || alerts.length === 0) {
      return
    }

    if (Notification.permission !== 'granted') {
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

export async function requestNotificationPermission(): Promise<boolean> {
  if (!canUseWebNotifications()) {
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

/** Defer until after iOS finishes the location permission sheet. */
export function requestNotificationPermissionAfterDelay(
  delayMs = NOTIFICATION_PROMPT_DELAY_MS,
): void {
  if (!canUseWebNotifications() || Notification.permission !== 'default') {
    return
  }

  window.setTimeout(() => {
    void requestNotificationPermission()
  }, delayMs)
}
