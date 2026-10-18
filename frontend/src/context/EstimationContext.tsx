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
  travelDistanceText: string | null
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
  const [travelDistanceText, setTravelDistanceText] = useState<string | null>(
    () => cached?.distanceText ?? null,
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
    setState('loading')
    setErrorMessage(null)

    try {
      const data = await fetchTravelTimes(latitude, longitude)
      const terminal = data.langkawiTerminal

      setTravelSeconds(terminal.durationSeconds)
      setTravelDurationText(terminal.durationText)
      setTravelDistanceText(terminal.distanceText)
      setTravelProvider(terminal.provider)
      setState('ready')
      setLocationEnabledPref(true)
      setStoredGeoPermission('granted')
      setCachedTravelEstimate({
        durationSeconds: terminal.durationSeconds,
        durationText: terminal.durationText,
        distanceMeters: terminal.distanceMeters,
        distanceText: terminal.distanceText,
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
        setTravelDistanceText(null)
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

    setState('locating')
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
          setTravelDistanceText(null)
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

  // Permission stays in browser settings; travel cache is only for instant UI.
  // Every visit: refresh GPS when location was previously enabled (no re-prompt if still granted).
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

      if (permission === 'denied') {
        setState('denied')
        setErrorMessage('Location access denied.')
        return
      }

      // granted / unknown / prompt-after-prior-enable: get a fresh fix.
      // If still granted, the browser will not show the permission dialog.
      requestLocation({ fresh: true })
    })()
  }, [requestLocation])

  useEffect(() => {
    refreshNotificationPermission()
  }, [refreshNotificationPermission])

  const evaluateTrip = useCallback(
    (routeLabel: string, isoDate: string, departureTime: string) => {
      // Keep using last known travel time while a refresh is in flight.
      if (
        travelSeconds === null ||
        (state !== 'ready' && state !== 'locating' && state !== 'loading')
      ) {
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
      travelDistanceText,
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
      travelDistanceText,
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
