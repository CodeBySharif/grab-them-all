import { useCallback, useEffect, useState } from 'react'
import { fetchFerrySchedules } from './api/schedules'
import { EstimationBanner } from './components/EstimationBanner'
import { PriorityAlerts } from './components/PriorityAlerts'
import { ScheduleGrid } from './components/ScheduleGrid'
import { TopBar } from './components/TopBar'
import { EstimationProvider } from './context/EstimationContext'
import type { DaySchedule, FerryScheduleResponse, TransportOption } from './types/schedule'

function formatTodayHeader() {
  const now = new Date()
  const dayLabel = now.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase()
  const dateLabel = now
    .toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
    .toUpperCase()

  return { dayLabel, dateLabel }
}

function FlightPlaceholder() {
  return (
    <div className="rounded-lg border border-hairline bg-surface-1 p-12 text-center">
      <p className="text-lg font-medium text-ink">Flight schedules</p>
      <p className="mt-2 text-sm text-ink-subtle">Coming soon</p>
    </div>
  )
}

function App() {
  const [option, setOption] = useState<TransportOption>('ferry')
  const [schedules, setSchedules] = useState<FerryScheduleResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadSchedules = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const data = await fetchFerrySchedules()
      setSchedules(data)
    } catch {
      setError('Unable to load ferry schedules. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadSchedules()
  }, [loadSchedules])

  const today = formatTodayHeader()
  const firstDay: DaySchedule | undefined = schedules?.days[0]

  const dayLabel = firstDay?.dayLabel ?? today.dayLabel
  const dateLabel = firstDay?.dateLabel ?? today.dateLabel

  return (
    <EstimationProvider>
      <div className="min-h-screen bg-canvas">
        <TopBar
          dayLabel={dayLabel}
          dateLabel={dateLabel}
          option={option}
          onOptionChange={setOption}
        />

        <main className="mx-auto max-w-7xl px-4 pb-32 pt-36">
          {option === 'ferry' ? (
            <>
              <EstimationBanner />

              {error ? (
              <div className="rounded-lg border border-hairline bg-surface-1 p-8 text-center">
                <p className="text-ink-muted">{error}</p>
                <button
                  type="button"
                  onClick={() => void loadSchedules()}
                  className="mt-4 rounded-md bg-primary px-3.5 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-focus/50"
                >
                  Retry
                </button>
              </div>
            ) : (
              <ScheduleGrid days={schedules?.days ?? []} loading={loading} />
            )}

            {!loading && schedules && (
              <PriorityAlerts days={schedules.days} />
            )}

            {schedules && !loading && (
              <p className="mt-6 text-center text-xs text-ink-tertiary">
                Updated {new Date(schedules.fetchedAt).toLocaleString()}
              </p>
            )}
          </>
        ) : (
          <FlightPlaceholder />
        )}
        </main>
      </div>
    </EstimationProvider>
  )
}

export default App
