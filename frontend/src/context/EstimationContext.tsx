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
  setCachedTravelEstimate,
  setLocationEnabledPref,
} from '../utils/preferences'

interface EstimationContextValue {
  state: EstimationState
  travelSeconds: number | null
  travelDurationText: string | null
  travelProvider: 'openrouteservice' | 'haversine' | null
  errorMessage: string | null
  notificationPermission: NotificationPermission | 'unsupported'
  requestLocation: () => void
  evaluateTrip: (
    routeLabel: string,
    isoDate: string,
    departureTime: string,
  ) => ReturnType<typeof evaluateArrival> | 'unavailable'
  refreshNotificationPermission: () => void
}

const EstimationContext = createContext<EstimationContextValue | null>(null)

export function EstimationProvider({ children }: { children: ReactNode }) {
  const cached = getCachedTravelEstimate()
  const hadLocationPref = getLocationEnabledPref()

  const [state, setState] = useState<EstimationState>(() =>
    hadLocationPref && cached ? 'ready' : hadLocationPref ? 'locating' : 'idle',
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
  const didAutoRequest = useRef(false)

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
      setTravelProvider(terminal.provider)
      setState('ready')
      setLocationEnabledPref(true)
      setCachedTravelEstimate({
        durationSeconds: terminal.durationSeconds,
        durationText: terminal.durationText,
        provider: terminal.provider,
      })
    } catch {
      setState('error')
      setErrorMessage('Unable to estimate travel time.')
      setTravelSeconds(null)
      setTravelDurationText(null)
      setTravelProvider(null)
      clearCachedTravelEstimate()
    }
  }, [])

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setState('error')
      setErrorMessage('Geolocation is not supported by this browser.')
      return
    }

    setState((prev) => (prev === 'ready' ? prev : 'locating'))
    setErrorMessage(null)

    navigator.geolocation.getCurrentPosition(
      (position) => {
        void loadTravelTimes(
          position.coords.latitude,
          position.coords.longitude,
        )
      },
      (error) => {
        setTravelSeconds(null)
        setTravelDurationText(null)
        setTravelProvider(null)
        clearCachedTravelEstimate()

        if (error.code === error.PERMISSION_DENIED) {
          setLocationEnabledPref(false)
          setState('denied')
          setErrorMessage('Location access denied.')
        } else {
          setState('error')
          setErrorMessage('Unable to get your location.')
        }
      },
      { enableHighAccuracy: false, timeout: 20000, maximumAge: 60_000 },
    )
  }, [loadTravelTimes])

  // Restore location on revisit — browser keeps the permission; we re-fetch quietly.
  useEffect(() => {
    if (didAutoRequest.current) {
      return
    }

    if (!getLocationEnabledPref()) {
      return
    }

    didAutoRequest.current = true
    requestLocation()
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
