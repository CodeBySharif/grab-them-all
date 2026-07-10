import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { fetchTravelTimes } from '../api/estimation'
import type { EstimationState } from '../types/estimation'
import { evaluateArrival } from '../utils/ferryTiming'
import { notificationPermission } from '../utils/platform'
import {
  clearCachedTravelEstimate,
  getCachedTravelEstimate,
  getLocationEnabledPref,
  queryGeolocationPermission,
  setCachedTravelEstimate,
  setLocationEnabledPref,
  setStoredGeoPermission,
} from '../utils/preferences'

interface EstimationContextValue {
  state: EstimationState
  travelSeconds: number | null
  travelDurationText: string | null
  travelProvider: 'openrouteservice' | 'haversine' | null
  errorMessage: string | null
  notificationPermission: NotificationPermission | 'unsupported'
  requestLocation: (options?: { fresh?: boolean }) => void
  evaluateTrip: (
    routeLabel: string,
    isoDate: string,
    departureTime: string,
  ) => ReturnType<typeof evaluateArrival> | 'unavailable'
  refreshNotificationPermission: () => void
}

const EstimationContext = createContext<EstimationContextValue | null>(null)

function initialCachedEstimate() {
  return (
    getCachedTravelEstimate() ??
    getCachedTravelEstimate({ allowStale: true })
  )
}

export function EstimationProvider({ children }: { children: ReactNode }) {
  const cached = initialCachedEstimate()
  const hadLocationPref = getLocationEnabledPref()

  const [state, setState] = useState<EstimationState>(() =>
    hadLocationPref && cached ? 'ready' : 'idle',
  )
  const [travelSeconds, setTravelSeconds] = useState<number | null>(
    () => cached?.durationSeconds ?? null,
  )
  const [travelDurationText, setTravelDurationText] = useState<string | null>(
    () => cached?.durationText ?? null,
  )
  const [travelProvider, setTravelProvider] = useState<
    'openrouteservice' | 'haversine' | null
  >(() => cached?.provider ?? null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [notifyPermission, setNotifyPermission] = useState(
    notificationPermission(),
  )
  const didAutoRestore = useRef(false)

  const refreshNotificationPermission = useCallback(() => {
    setNotifyPermission(notificationPermission())
  }, [])

  const loadTravelTimes = useCallback(async (latitude: number, longitude: number) => {
    setState((prev) => (prev === 'ready' ? prev : 'loading'))
    setErrorMessage(null)

    try {
      const data = await fetchTravelTimes(latitude, longitude)
      const terminal = data.langkawiTerminal

      setTravelSeconds(terminal.durationSeconds)
      setTravelDurationText(terminal.durationText)
      setTravelProvider(terminal.provider)
      setState('ready')
      setLocationEnabledPref(true)
      setStoredGeoPermission('granted')
      setCachedTravelEstimate({
        durationSeconds: terminal.durationSeconds,
        durationText: terminal.durationText,
        provider: terminal.provider,
      })
    } catch {
      setTravelSeconds((prevSeconds) => {
        if (prevSeconds !== null) {
          setState('ready')
          return prevSeconds
        }

        setState('error')
        setErrorMessage('Unable to estimate travel time.')
        setTravelDurationText(null)
        setTravelProvider(null)
        clearCachedTravelEstimate()
        return null
      })
    }
  }, [])

  const requestLocation = useCallback((options?: { fresh?: boolean }) => {
    if (!navigator.geolocation) {
      setState('error')
      setErrorMessage('Geolocation is not supported by this browser.')
      return
    }

    const wantFresh = options?.fresh !== false

    setState((prev) => (prev === 'ready' ? prev : 'locating'))
    setErrorMessage(null)

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setStoredGeoPermission('granted')
        void loadTravelTimes(
          position.coords.latitude,
          position.coords.longitude,
        )
      },
      (error) => {
        if (error.code === error.PERMISSION_DENIED) {
          setStoredGeoPermission('denied')
          setLocationEnabledPref(false)
          clearCachedTravelEstimate()
          setTravelSeconds(null)
          setTravelDurationText(null)
          setTravelProvider(null)
          setState('denied')
          setErrorMessage('Location access denied.')
          return
        }

        // Timeout / unavailable — keep cached estimate if present.
        setTravelSeconds((prev) => {
          if (prev !== null) {
            setState('ready')
            setErrorMessage(null)
            return prev
          }

          setState('error')
          setErrorMessage('Unable to get your location.')
          return null
        })
      },
      {
        enableHighAccuracy: false,
        timeout: 20000,
        // Fresh fix each visit so drive-time estimate stays current.
        maximumAge: wantFresh ? 0 : 300_000,
      },
    )
  }, [loadTravelTimes])

  // Cache permission only — always refresh GPS when already granted (no re-prompt).
  useEffect(() => {
    if (didAutoRestore.current) {
      return
    }
    didAutoRestore.current = true

    if (!getLocationEnabledPref()) {
      return
    }

    void (async () => {
      const permission = await queryGeolocationPermission()

      if (permission === 'granted') {
        // Instant UI from last estimate, then refresh with a new position.
        requestLocation({ fresh: true })
        return
      }

      // Not granted — never auto-call GPS (would show the permission dialog).
      const stale = getCachedTravelEstimate({ allowStale: true })
      if (stale) {
        setTravelSeconds(stale.durationSeconds)
        setTravelDurationText(stale.durationText)
        setTravelProvider(stale.provider)
        setState('ready')
        return
      }

      setState('idle')
    })()
  }, [requestLocation])

  useEffect(() => {
    refreshNotificationPermission()
  }, [refreshNotificationPermission])

  const evaluateTrip = useCallback(
    (routeLabel: string, isoDate: string, departureTime: string) => {
      if (travelSeconds === null || state !== 'ready') {
        return 'unavailable' as const
      }

      return evaluateArrival(
        routeLabel,
        isoDate,
        departureTime,
        travelSeconds,
      )
    },
    [travelSeconds, state],
  )

  const value = useMemo(
    () => ({
      state,
      travelSeconds,
      travelDurationText,
      travelProvider,
      errorMessage,
      notificationPermission: notifyPermission,
      requestLocation,
      evaluateTrip,
      refreshNotificationPermission,
    }),
    [
      state,
      travelSeconds,
      travelDurationText,
      travelProvider,
      errorMessage,
      notifyPermission,
      requestLocation,
      evaluateTrip,
      refreshNotificationPermission,
    ],
  )

  return (
    <EstimationContext.Provider value={value}>
      {children}
    </EstimationContext.Provider>
  )
}

export function useEstimation() {
  const context = useContext(EstimationContext)
  if (!context) {
    throw new Error('useEstimation must be used within EstimationProvider')
  }
  return context
}
