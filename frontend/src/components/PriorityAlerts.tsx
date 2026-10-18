import { useCallback, useMemo, useState } from 'react'
import { useEstimation } from '../context/EstimationContext'
import { useNowTick } from '../hooks/useNowTick'
import { usePriorityNotifications } from '../hooks/usePriorityNotifications'
import type { DaySchedule } from '../types/schedule'
import { collectPriorityAlerts } from '../utils/priorityAlerts'
import { PriorityAlertToast } from './PriorityAlertToast'

interface PriorityAlertsProps {
  days: DaySchedule[]
}

export function PriorityAlerts({ days }: PriorityAlertsProps) {
  const { state, travelSeconds } = useEstimation()
  const now = useNowTick()
  const [dismissed, setDismissed] = useState<Set<string>>(() => new Set())

  const estimateReady =
    travelSeconds !== null &&
    (state === 'ready' || state === 'locating' || state === 'loading')

  const alerts = useMemo(() => {
    if (!estimateReady || travelSeconds === null) {
      return []
    }

    return collectPriorityAlerts(days, travelSeconds, now).filter(
      (alert) => !dismissed.has(alert.id),
    )
  }, [days, travelSeconds, estimateReady, now, dismissed])

  usePriorityNotifications(alerts, estimateReady)

  const handleDismiss = useCallback((id: string) => {
    setDismissed((prev) => new Set(prev).add(id))
  }, [])

  return <PriorityAlertToast alerts={alerts} onDismiss={handleDismiss} />
}
