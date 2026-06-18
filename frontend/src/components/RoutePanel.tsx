import { useEstimation } from '../context/EstimationContext'
import { useNowTick } from '../hooks/useNowTick'
import type { RouteSchedule } from '../types/schedule'
import { computeTripDriverTiming } from '../utils/ferryTiming'
import { MAX_TRIPS_PER_ROUTE } from '../utils/scheduleLayout'
import { TripItem } from './TripItem'
import { TripSlotPlaceholder } from './TripSlotPlaceholder'

interface RoutePanelProps {
  label: string
  dayDate: string
  route: RouteSchedule | null
}

export function RoutePanel({ label, dayDate, route }: RoutePanelProps) {
  const { evaluateTrip, state, travelSeconds } = useEstimation()
  const now = useNowTick()
  const isLoading = state === 'locating' || state === 'loading'

  const trips = (route?.trips ?? []).slice(0, MAX_TRIPS_PER_ROUTE)
  const slots = Array.from({ length: MAX_TRIPS_PER_ROUTE }, (_, index) =>
    trips[index] ?? null,
  )

  return (
    <section className="flex h-full flex-col rounded-md border border-hairline bg-surface-2/40 p-3">
      <h3 className="mb-2 shrink-0 border-b border-hairline pb-2 text-center text-xs font-medium tracking-wide text-ink-muted">
        {label}
      </h3>
      <div className="flex flex-1 flex-col">
        {slots.map((trip, index) => {
          if (!trip) {
            return <TripSlotPlaceholder key={`${label}-empty-${index}`} />
          }

          const arrivalStatus = isLoading
            ? 'loading'
            : evaluateTrip(label, dayDate, trip.departureTime)

          const timing =
            travelSeconds !== null && state === 'ready'
              ? computeTripDriverTiming(
                  label,
                  dayDate,
                  trip.departureTime,
                  travelSeconds,
                  now,
                )
              : computeTripDriverTiming(
                  label,
                  dayDate,
                  trip.departureTime,
                  null,
                  now,
                )

          return (
            <TripItem
              key={`${label}-${trip.departureTime}-${index}`}
              trip={trip}
              arrivalStatus={arrivalStatus}
              timing={timing}
              now={now}
            />
          )
        })}
      </div>
    </section>
  )
}
