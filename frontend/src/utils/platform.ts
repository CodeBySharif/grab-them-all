export function isIOS(): boolean {
  if (typeof navigator === 'undefined') {
    return false
  }

  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  )
}

export function isStandalonePwa(): boolean {
  if (typeof window === 'undefined') {
    return false
  }

  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    ('standalone' in navigator &&
      (navigator as Navigator & { standalone?: boolean }).standalone === true)
  )
}

/** Whether the browser can show the notification permission prompt. */
export function canRequestNotificationPermission(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window
}

/** Whether we can fire a browser Notification (granted + supported context). */
export function canSendBrowserNotifications(): boolean {
  if (!canRequestNotificationPermission()) {
    return false
  }

  if (Notification.permission !== 'granted') {
    return false
  }

  // iOS only delivers web notifications for installed home-screen PWAs (16.4+).
  if (isIOS() && !isStandalonePwa()) {
    return false
  }

  return true
}

export function notificationPermission(): NotificationPermission | 'unsupported' {
  if (!canRequestNotificationPermission()) {
    return 'unsupported'
  }

  return Notification.permission
}
