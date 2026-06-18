export interface Trip {
  departureTime: string
  vesselName: string
  isExtraTrip: boolean
  isClosed: boolean
}

export interface RouteSchedule {
  name: string
  trips: Trip[]
}

export interface DaySchedule {
  dayLabel: string
  dateLabel: string
  date: string
  routes: RouteSchedule[]
}

export interface FerryScheduleResponse {
  fetchedAt: string
  days: DaySchedule[]
}

export type TransportOption = 'ferry' | 'flight'
