import type { DaySchedule } from '../types/schedule'
import { ScheduleCard } from './ScheduleCard'

interface ScheduleGridProps {
  days: DaySchedule[]
  loading?: boolean
}

function ScheduleSkeleton() {
  return (
    <div className="animate-pulse rounded-lg border border-hairline bg-surface-1 p-4 sm:p-5">
      <div className="mb-4 flex flex-col items-center gap-2">
        <div className="h-5 w-12 rounded bg-surface-2" />
        <div className="h-3 w-24 rounded bg-surface-2" />
      </div>
      <div className="space-y-4">
        <div>
          <div className="mb-2 h-3 w-28 mx-auto rounded bg-surface-2" />
          <div className="grid grid-cols-2 items-stretch gap-3">
            <div className="flex flex-col gap-0 rounded-md bg-surface-2 p-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="h-[5.25rem] border-b border-hairline/50 last:border-b-0"
                />
              ))}
            </div>
            <div className="flex flex-col gap-0 rounded-md bg-surface-2 p-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="h-[5.25rem] border-b border-hairline/50 last:border-b-0"
                />
              ))}
            </div>
          </div>
        </div>
        <div>
          <div className="mb-2 h-3 w-32 mx-auto rounded bg-surface-2" />
          <div className="grid grid-cols-2 items-stretch gap-3">
            <div className="flex flex-col gap-0 rounded-md bg-surface-2 p-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="h-[5.25rem] border-b border-hairline/50 last:border-b-0"
                />
              ))}
            </div>
            <div className="flex flex-col gap-0 rounded-md bg-surface-2 p-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="h-[5.25rem] border-b border-hairline/50 last:border-b-0"
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export function ScheduleGrid({ days, loading }: ScheduleGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <ScheduleSkeleton />
        <ScheduleSkeleton />
        <ScheduleSkeleton />
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      {days.map((day) => (
        <ScheduleCard key={day.date} day={day} />
      ))}
    </div>
  )
}
