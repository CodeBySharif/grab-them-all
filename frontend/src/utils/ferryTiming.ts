import type { ArrivalStatus } from '../types/estimation'

export const ROUTE_LABELS = {
  langkawiKedah: 'Langkawi — Kedah',
  langkawiPerlis: 'Langkawi — Perlis',
  kedahLangkawi: 'Kedah — Langkawi',
  perlisLangkawi: 'Perlis — Langkawi',
} as const

export const OUTBOUND_CHECKIN_MINUTES = 60

export const FERRY_CROSSING = {
  kedah: { min: 90, max: 120 },
  perlis: { min: 60, max: 90 },
} as const

export const PRIORITY_URGENT_MINUTES = 15
export const PRIORITY_SOON_MINUTES = 30

export type TripPriority = 'urgent' | 'soon' | 'normal' | 'past'

export interface TripDriverTiming {
  kind: 'inbound' | 'outbound'
  departure: Date
  ferryArrivalEarliest: Date | null
  ferryArrivalLatest: Date | null
  terminalDeadline: Date | null
  leaveBy: Date | null
  priority: TripPriority
  primaryLabel: string
  primaryTime: string
  secondaryLabel: string | null
  secondaryTime: string | null
}

export function parseDepartureDateTime(
  isoDate: string,
  departureTime: string,
): Date | null {
  const match = departureTime.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i)
  if (!match) {
    return null
  }

  const [year, month, day] = isoDate.split('-').map(Number)
  let hours = Number.parseInt(match[1], 10)
  const minutes = Number.parseInt(match[2], 10)
  const meridiem = match[3].toUpperCase()

  if (meridiem === 'PM' && hours !== 12) {
    hours += 12
  } else if (meridiem === 'AM' && hours === 12) {
    hours = 0
  }

  return new Date(year, month - 1, day, hours, minutes, 0, 0)
}

export function formatClockTime(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

export function formatTimeRange(from: Date, to: Date): string {
  return `${formatClockTime(from)} – ${formatClockTime(to)}`
}

export function isOutboundRoute(routeLabel: string): boolean {
  return (
    routeLabel === ROUTE_LABELS.langkawiKedah ||
    routeLabel === ROUTE_LABELS.langkawiPerlis
  )
}

export function isInboundRoute(routeLabel: string): boolean {
  return (
    routeLabel === ROUTE_LABELS.kedahLangkawi ||
    routeLabel === ROUTE_LABELS.perlisLangkawi
  )
}

function getCrossingMinutes(routeLabel: string) {
  if (routeLabel === ROUTE_LABELS.kedahLangkawi) {
    return FERRY_CROSSING.kedah
  }
  if (routeLabel === ROUTE_LABELS.perlisLangkawi) {
    return FERRY_CROSSING.perlis
  }
  return null
}

export function getFerryArrivalWindow(
  routeLabel: string,
  departure: Date,
): { earliest: Date; latest: Date } | null {
  const crossing = getCrossingMinutes(routeLabel)
  if (!crossing) {
    return null
  }

  return {
    earliest: new Date(departure.getTime() + crossing.min * 60 * 1000),
    latest: new Date(departure.getTime() + crossing.max * 60 * 1000),
  }
}

export function getOutboundTerminalDeadline(departure: Date): Date {
  return new Date(
    departure.getTime() - OUTBOUND_CHECKIN_MINUTES * 60 * 1000,
  )
}

function minutesUntil(from: Date, to: Date): number {
  return (to.getTime() - from.getTime()) / 60_000
}

function computePriority(
  kind: 'inbound' | 'outbound',
  now: Date,
  leaveBy: Date | null,
  eventTime: Date,
  pastAfter: Date,
): TripPriority {
  if (pastAfter < now) {
    return 'past'
  }

  const minutesToEvent = minutesUntil(now, eventTime)
  const minutesToLeave = leaveBy ? minutesUntil(now, leaveBy) : null

  if (minutesToEvent <= PRIORITY_URGENT_MINUTES) {
    return 'urgent'
  }

  if (minutesToLeave !== null && minutesToLeave <= PRIORITY_URGENT_MINUTES) {
    return 'urgent'
  }

  if (minutesToEvent <= PRIORITY_SOON_MINUTES) {
    return 'soon'
  }

  if (minutesToLeave !== null && minutesToLeave <= PRIORITY_SOON_MINUTES) {
    return 'soon'
  }

  if (kind === 'inbound' && leaveBy && leaveBy < now) {
    return 'urgent'
  }

  return 'normal'
}

export function computeTripDriverTiming(
  routeLabel: string,
  isoDate: string,
  departureTime: string,
  travelSeconds: number | null,
  now: Date = new Date(),
): TripDriverTiming | null {
  const departure = parseDepartureDateTime(isoDate, departureTime)
  if (!departure) {
    return null
  }

  if (isOutboundRoute(routeLabel)) {
    const terminalDeadline = getOutboundTerminalDeadline(departure)
    const driverLeaveBy =
      travelSeconds !== null
        ? new Date(terminalDeadline.getTime() - travelSeconds * 1000)
        : null

    const priority = computePriority(
      'outbound',
      now,
      driverLeaveBy,
      terminalDeadline,
      departure,
    )

    return {
      kind: 'outbound',
      departure,
      ferryArrivalEarliest: null,
      ferryArrivalLatest: null,
      terminalDeadline,
      leaveBy: driverLeaveBy,
      priority,
      primaryLabel: 'Be around terminal at',
      primaryTime: formatClockTime(terminalDeadline),
      secondaryLabel: driverLeaveBy ? 'Leave by' : null,
      secondaryTime: driverLeaveBy ? formatClockTime(driverLeaveBy) : null,
    }
  }

  if (isInboundRoute(routeLabel)) {
    const arrivalWindow = getFerryArrivalWindow(routeLabel, departure)
    if (!arrivalWindow) {
      return null
    }

    const driverLeaveBy =
      travelSeconds !== null
        ? new Date(
            arrivalWindow.earliest.getTime() - travelSeconds * 1000,
          )
        : null

    const priority = computePriority(
      'inbound',
      now,
      driverLeaveBy,
      arrivalWindow.earliest,
      arrivalWindow.latest,
    )

    return {
      kind: 'inbound',
      departure,
      ferryArrivalEarliest: arrivalWindow.earliest,
      ferryArrivalLatest: arrivalWindow.latest,
      terminalDeadline: null,
      leaveBy: driverLeaveBy,
      priority,
      primaryLabel: 'Ferry arrives',
      primaryTime: formatTimeRange(
        arrivalWindow.earliest,
        arrivalWindow.latest,
      ),
      secondaryLabel: driverLeaveBy ? 'Leave by' : null,
      secondaryTime: driverLeaveBy ? formatClockTime(driverLeaveBy) : null,
    }
  }

  return null
}

export function isTripEstimationPast(timing: TripDriverTiming, now: Date): boolean {
  if (timing.kind === 'inbound' && timing.ferryArrivalLatest) {
    return timing.ferryArrivalLatest < now
  }

  if (timing.kind === 'outbound') {
    return timing.departure < now
  }

  return timing.priority === 'past'
}

export function getTerminalDeadline(
  routeLabel: string,
  departure: Date,
): Date | null {
  if (isOutboundRoute(routeLabel)) {
    return getOutboundTerminalDeadline(departure)
  }

  const arrivalWindow = getFerryArrivalWindow(routeLabel, departure)
  return arrivalWindow?.earliest ?? null
}

export function evaluateArrival(
  routeLabel: string,
  isoDate: string,
  departureTime: string,
  travelSeconds: number,
  now: Date = new Date(),
): ArrivalStatus {
  const departure = parseDepartureDateTime(isoDate, departureTime)
  if (!departure) {
    return 'unavailable'
  }

  if (isOutboundRoute(routeLabel)) {
    if (departure < now) {
      return 'past'
    }

    const etaAtTerminal = new Date(now.getTime() + travelSeconds * 1000)
    return etaAtTerminal <= departure ? 'yes' : 'no'
  }

  const deadline = getTerminalDeadline(routeLabel, departure)
  if (!deadline) {
    return 'unavailable'
  }

  const arrivalWindow = getFerryArrivalWindow(routeLabel, departure)
  const estimationEnd =
    arrivalWindow?.latest ?? deadline

  if (estimationEnd < now) {
    return 'past'
  }

  const etaAtTerminal = new Date(now.getTime() + travelSeconds * 1000)
  return etaAtTerminal <= deadline ? 'yes' : 'no'
}

export function getPriorityAlertMessage(timing: TripDriverTiming): string {
  const routeHint =
    timing.kind === 'inbound'
      ? 'Inbound ferry arriving at Langkawi'
      : 'Outbound — reach Langkawi terminal'

  if (timing.priority === 'urgent') {
    if (timing.leaveBy && timing.leaveBy <= new Date()) {
      return `${routeHint}: leave now! Target ${timing.primaryTime}`
    }
    return `${routeHint}: approaching — ${timing.primaryLabel} ${timing.primaryTime}`
  }

  return `${routeHint}: ${timing.primaryLabel} ${timing.primaryTime}`
}
