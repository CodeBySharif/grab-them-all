import type { TravelTimesResponse } from '../types/estimation'

export async function fetchTravelTimes(
  latitude: number,
  longitude: number,
): Promise<TravelTimesResponse> {
  const params = new URLSearchParams({
    latitude: latitude.toString(),
    longitude: longitude.toString(),
  })

  const response = await fetch(`/api/estimation/travel-times?${params}`)

  if (!response.ok) {
    throw new Error('Unable to fetch travel times')
  }

  return response.json() as Promise<TravelTimesResponse>
}
