import type { DaySchedule } from '../types/schedule'
import { INBOUND_ROUTE_COUNT, orderRoutesForGrid } from '../utils/routes'
import { RoutePanel } from './RoutePanel'

interface ScheduleCardProps {
  day: DaySchedule
}

function DayHeader({ dayLabel, dateLabel }: { dayLabel: string; dateLabel: string }) {
  return (
    <header className="text-center">
      <p className="text-lg font-semibold tracking-wide text-ink">{dayLabel}</p>
      <p className="mt-0.5 text-xs text-ink-subtle">{dateLabel}</p>
    </header>
  )
}

function RouteSection({
  title,
  routes,
  dayDate,
}: {
  title: string
  routes: ReturnType<typeof orderRoutesForGrid>
  dayDate: string
}) {
  return (
    <section>
      <p className="mb-2 text-center text-[10px] font-medium uppercase tracking-wider text-ink-subtle">
        {title}
      </p>
      <div className="grid grid-cols-2 items-stretch gap-3">
        {routes.map(({ label, route }) => (
          <RoutePanel key={label} label={label} dayDate={dayDate} route={route} />
        ))}
      </div>
    </section>
  )
}

export function ScheduleCard({ day }: ScheduleCardProps) {
  const routeGrid = orderRoutesForGrid(day.routes)
  const inboundRoutes = routeGrid.slice(0, INBOUND_ROUTE_COUNT)
  const outboundRoutes = routeGrid.slice(INBOUND_ROUTE_COUNT)

  return (
    <article className="rounded-lg border border-hairline bg-surface-1 p-4 sm:p-5">
      <div className="mb-4">
        <DayHeader dayLabel={day.dayLabel} dateLabel={day.dateLabel} />
      </div>

      <div className="space-y-4">
        <RouteSection
          title="Inbound to Langkawi"
          routes={inboundRoutes}
          dayDate={day.date}
        />

        <div className="space-y-4 border-t border-hairline pt-4">
          <DayHeader dayLabel={day.dayLabel} dateLabel={day.dateLabel} />
          <RouteSection
            title="Outbound from Langkawi"
            routes={outboundRoutes}
            dayDate={day.date}
          />
        </div>
      </div>
    </article>
  )
}
