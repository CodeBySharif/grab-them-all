import { ArrivalIndicator } from './ArrivalIndicator'
import type { ArrivalStatus } from '../types/estimation'
import type { Trip } from '../types/schedule'
import type { TripDriverTiming, TripPriority } from '../utils/ferryTiming'
import { isTripEstimationPast } from '../utils/ferryTiming'
import { TRIP_SLOT_HEIGHT } from '../utils/scheduleLayout'

interface TripItemProps {
  trip: Trip
  arrivalStatus: ArrivalStatus | 'unavailable' | 'loading'
  timing: TripDriverTiming | null
  now: Date
}

const priorityStyles: Record<TripPriority, string> = {
  urgent: 'border-l-2 border-l-red-500 bg-red-500/5 pl-2',
  soon: 'border-l-2 border-l-primary bg-primary/5 pl-2',
  normal: '',
  past: '',
}

export function TripItem({ trip, arrivalStatus, timing, now }: TripItemProps) {
  const isPast = timing ? isTripEstimationPast(timing, now) : false
  const showArrival = !isPast && arrivalStatus !== 'unavailable'
  const priorityClass =
    timing && timing.priority !== 'normal' && timing.priority !== 'past'
      ? priorityStyles[timing.priority]
      : ''

  return (
    <div
      className={[
        `${TRIP_SLOT_HEIGHT} overflow-hidden border-b border-hairline py-2 last:border-b-0`,
        isPast ? 'opacity-60' : '',
        priorityClass,
      ].join(' ')}
    >
      <div className="flex items-start justify-between gap-1">
        <p
          className={[
            'font-mono text-xs font-medium leading-tight',
            isPast ? 'text-ink-subtle line-through' : 'text-ink',
          ].join(' ')}
        >
          {trip.departureTime}
          {trip.isExtraTrip && (
            <span className="ml-0.5 text-ink-subtle">*</span>
          )}
        </p>
        <div className="flex shrink-0 flex-col items-end gap-0.5">
          {showArrival && <ArrivalIndicator status={arrivalStatus} />}
          {isPast && (
            <span className="rounded-pill bg-surface-2 px-1.5 py-px text-[10px] text-ink-subtle">
              Closed
            </span>
          )}
        </div>
      </div>

      {timing && !isPast && (
        <div className="mt-1 space-y-0.5">
          <p className="text-[10px] leading-tight text-ink-muted">
            <span className="text-ink-subtle">{timing.primaryLabel}: </span>
            <span className="font-medium text-ink">{timing.primaryTime}</span>
          </p>
          {timing.secondaryLabel && timing.secondaryTime && (
            <p className="text-[10px] leading-tight text-ink-muted">
              <span className="text-ink-subtle">{timing.secondaryLabel}: </span>
              <span
                className={[
                  'font-medium',
                  timing.priority === 'urgent' ? 'text-red-400' : 'text-primary',
                ].join(' ')}
              >
                {timing.secondaryTime}
              </span>
            </p>
          )}
        </div>
      )}

      <p className="mt-0.5 truncate text-[11px] leading-tight text-ink-muted">
        {trip.vesselName}
      </p>
    </div>
  )
}
