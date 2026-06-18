import type { FerryScheduleResponse } from '../types/schedule'

export async function fetchFerrySchedules(): Promise<FerryScheduleResponse> {
  const response = await fetch('/api/schedules/ferry')

  if (!response.ok) {
    throw new Error('Unable to load ferry schedules')
  }

  return response.json() as Promise<FerryScheduleResponse>
}
