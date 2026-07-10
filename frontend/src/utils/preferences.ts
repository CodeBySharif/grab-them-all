const LOCATION_ENABLED_KEY = 'ferry-flight:location-enabled'
const GEO_PERMISSION_KEY = 'ferry-flight:geo-permission'
const TRAVEL_CACHE_KEY = 'ferry-flight:travel-cache'

/** Fresh enough to skip GPS entirely on revisit. */
const TRAVEL_CACHE_MAX_AGE_MS = 4 * 60 * 60 * 1000

/** Stale but still usable for UI if we must not re-prompt. */
const TRAVEL_CACHE_STALE_MAX_AGE_MS = 24 * 60 * 60 * 1000

export type StoredGeoPermission = 'granted' | 'denied' | 'prompt' | 'unknown'

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

export function getStoredGeoPermission(): StoredGeoPermission {
  try {
    const value = localStorage.getItem(GEO_PERMISSION_KEY)
    if (
      value === 'granted' ||
      value === 'denied' ||
      value === 'prompt' ||
      value === 'unknown'
    ) {
      return value
    }
  } catch {
    // ignore
  }
  return 'unknown'
}

export function setStoredGeoPermission(status: StoredGeoPermission): void {
  try {
    localStorage.setItem(GEO_PERMISSION_KEY, status)
  } catch {
    // ignore
  }
}

function parseTravelCache(raw: string): CachedTravelEstimate | null {
  try {
    const parsed = JSON.parse(raw) as CachedTravelEstimate
    if (
      typeof parsed.durationSeconds !== 'number' ||
      typeof parsed.durationText !== 'string' ||
      typeof parsed.savedAt !== 'number'
    ) {
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

export function getCachedTravelEstimate(
  options: { allowStale?: boolean } = {},
): CachedTravelEstimate | null {
  try {
    const raw = localStorage.getItem(TRAVEL_CACHE_KEY)
    if (!raw) {
      return null
    }

    const parsed = parseTravelCache(raw)
    if (!parsed) {
      return null
    }

    const age = Date.now() - parsed.savedAt
    const maxAge = options.allowStale
      ? TRAVEL_CACHE_STALE_MAX_AGE_MS
      : TRAVEL_CACHE_MAX_AGE_MS

    if (age > maxAge) {
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

/** Query browser geolocation permission without triggering a prompt. */
export async function queryGeolocationPermission(): Promise<StoredGeoPermission> {
  if (typeof navigator === 'undefined' || !navigator.permissions?.query) {
    return getStoredGeoPermission()
  }

  try {
    const result = await navigator.permissions.query({
      name: 'geolocation' as PermissionName,
    })
    if (
      result.state === 'granted' ||
      result.state === 'denied' ||
      result.state === 'prompt'
    ) {
      setStoredGeoPermission(result.state)
      return result.state
    }
  } catch {
    // Safari / some browsers reject geolocation permission queries
  }

  return getStoredGeoPermission()
}
