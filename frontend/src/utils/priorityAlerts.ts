import type { DaySchedule } from '../types/schedule'
import type { TripPriority, TripDriverTiming } from '../utils/ferryTiming'
import {
  computeTripDriverTiming,
  isInboundRoute,
  isOutboundRoute,
  PRIORITY_URGENT_MINUTES,
} from '../utils/ferryTiming'
import { orderRoutesForGrid } from '../utils/routes'

export interface PriorityTripAlert {
  id: string
  routeLabel: string
  dayDate: string
  departureTime: string
  vesselName: string
  timing: TripDriverTiming
  priority: TripPriority
  message: string
}

function buildAlertMessage(
  routeLabel: string,
  timing: TripDriverTiming,
  now: Date,
): string {
  if (timing.kind === 'inbound') {
    const mins = timing.ferryArrivalEarliest
      ? Math.round(
          (timing.ferryArrivalEarliest.getTime() - now.getTime()) / 60_000,
        )
      : null

    if (mins !== null && mins <= PRIORITY_URGENT_MINUTES) {
      return `Ferry from ${routeLabel.split(' — ')[0]} arriving ~${timing.primaryTime}`
    }

    if (timing.leaveBy && timing.leaveBy <= now) {
      return `Leave now to meet ${routeLabel} ferry`
    }

    if (timing.secondaryTime) {
      return `Pickup ${routeLabel}: leave by ${timing.secondaryTime}`
    }
  }

  if (timing.kind === 'outbound') {
    if (timing.leaveBy && timing.leaveBy <= now) {
      return `Leave now for ${routeLabel} drop-off`
    }

    return `Drop-off ${routeLabel}: be around terminal at ${timing.primaryTime}`
  }

  return `${routeLabel}: ${timing.primaryLabel} ${timing.primaryTime}`
}

export function collectPriorityAlerts(
  days: DaySchedule[],
  travelSeconds: number | null,
  now: Date,
): PriorityTripAlert[] {
  if (travelSeconds === null) {
    return []
  }

  const alerts: PriorityTripAlert[] = []

  for (const day of days) {
    const routeGrid = orderRoutesForGrid(day.routes)

    for (const { label, route } of routeGrid) {
      if (!route || (!isInboundRoute(label) && !isOutboundRoute(label))) {
        continue
      }

      for (const trip of route.trips) {
        const timing = computeTripDriverTiming(
          label,
          day.date,
          trip.departureTime,
          travelSeconds,
          now,
        )

        if (
          !timing ||
          timing.priority === 'normal' ||
          timing.priority === 'past'
        ) {
          continue
        }

        alerts.push({
          id: `${day.date}-${label}-${trip.departureTime}-${trip.vesselName}`,
          routeLabel: label,
          dayDate: day.date,
          departureTime: trip.departureTime,
          vesselName: trip.vesselName,
          timing,
          priority: timing.priority,
          message: buildAlertMessage(label, timing, now),
        })
      }
    }
  }

  const rank = { urgent: 0, soon: 1, normal: 2, past: 3 }
  return alerts.sort(
    (a, b) => rank[a.priority] - rank[b.priority],
  )
}
