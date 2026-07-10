const LOCATION_ENABLED_KEY = 'ferry-flight:location-enabled'
const TRAVEL_CACHE_KEY = 'ferry-flight:travel-cache'
const TRAVEL_CACHE_MAX_AGE_MS = 30 * 60 * 1000

export interface CachedTravelEstimate {
  durationSeconds: number
  durationText: string
  provider: 'openrouteservice' | 'haversine'
  savedAt: number
}

export function getLocationEnabledPref(): boolean {
  try {
    return localStorage.getItem(LOCATION_ENABLED_KEY) === '1'
  } catch {
    return false
  }
}

export function setLocationEnabledPref(enabled: boolean): void {
  try {
    localStorage.setItem(LOCATION_ENABLED_KEY, enabled ? '1' : '0')
  } catch {
    // Private mode / storage blocked
  }
}

export function getCachedTravelEstimate(): CachedTravelEstimate | null {
  try {
    const raw = localStorage.getItem(TRAVEL_CACHE_KEY)
    if (!raw) {
      return null
    }

    const parsed = JSON.parse(raw) as CachedTravelEstimate
    if (
      typeof parsed.durationSeconds !== 'number' ||
      typeof parsed.durationText !== 'string' ||
      typeof parsed.savedAt !== 'number'
    ) {
      return null
    }

    if (Date.now() - parsed.savedAt > TRAVEL_CACHE_MAX_AGE_MS) {
      return null
    }

    if (
      parsed.provider !== 'openrouteservice' &&
      parsed.provider !== 'haversine'
    ) {
      return null
    }

    return parsed
  } catch {
    return null
  }
}

export function setCachedTravelEstimate(
  estimate: Omit<CachedTravelEstimate, 'savedAt'>,
): void {
  try {
    const payload: CachedTravelEstimate = {
      ...estimate,
      savedAt: Date.now(),
    }
    localStorage.setItem(TRAVEL_CACHE_KEY, JSON.stringify(payload))
  } catch {
    // Private mode / storage blocked
  }
}

export function clearCachedTravelEstimate(): void {
  try {
    localStorage.removeItem(TRAVEL_CACHE_KEY)
  } catch {
    // ignore
  }
}
