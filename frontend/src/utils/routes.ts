import type { RouteSchedule } from '../types/schedule'

const ROUTE_SLOTS: { from: string; to: string; shortLabel: string }[] = [
  { from: 'kedah', to: 'langkawi', shortLabel: 'Kedah — Langkawi' },
  { from: 'perlis', to: 'langkawi', shortLabel: 'Perlis — Langkawi' },
  { from: 'langkawi', to: 'kedah', shortLabel: 'Langkawi — Kedah' },
  { from: 'langkawi', to: 'perlis', shortLabel: 'Langkawi — Perlis' },
]

export const INBOUND_ROUTE_COUNT = 2

function matchesRoute(routeName: string, from: string, to: string): boolean {
  const normalized = routeName.toLowerCase()

  if (from === 'langkawi') {
    return normalized.includes('langkawi to') && normalized.includes(to)
  }

  return normalized.includes(from) && normalized.includes('to langkawi')
}

export function orderRoutesForGrid(
  routes: RouteSchedule[],
): { label: string; route: RouteSchedule | null }[] {
  return ROUTE_SLOTS.map((slot) => {
    const route =
      routes.find((r) => matchesRoute(r.name, slot.from, slot.to)) ?? null
    return { label: slot.shortLabel, route }
  })
}

export function formatRouteShort(name: string): string {
  const slot = ROUTE_SLOTS.find((s) => matchesRoute(name, s.from, s.to))
  return slot?.shortLabel ?? name
}
