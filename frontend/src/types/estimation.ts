export interface TravelTimeResult {
  durationSeconds: number
  durationText: string
  provider: 'openrouteservice' | 'haversine'
}

export interface TravelTimesResponse {
  destination: { latitude: number; longitude: number }
  langkawiTerminal: TravelTimeResult
}

export type ArrivalStatus = 'yes' | 'no' | 'past' | 'unavailable'

export type EstimationState =
  | 'idle'
  | 'locating'
  | 'loading'
  | 'ready'
  | 'denied'
  | 'error'
