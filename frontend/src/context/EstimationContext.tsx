import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { fetchTravelTimes } from '../api/estimation'
import { requestNotificationPermission } from '../hooks/usePriorityNotifications'
import type { EstimationState } from '../types/estimation'
import { evaluateArrival } from '../utils/ferryTiming'

interface EstimationContextValue {
  state: EstimationState
  travelSeconds: number | null
  travelDurationText: string | null
  travelProvider: 'openrouteservice' | 'haversine' | null
  errorMessage: string | null
  requestLocation: () => void
  evaluateTrip: (
    routeLabel: string,
    isoDate: string,
    departureTime: string,
  ) => ReturnType<typeof evaluateArrival> | 'unavailable'
}

const EstimationContext = createContext<EstimationContextValue | null>(null)

export function EstimationProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<EstimationState>('idle')
  const [travelSeconds, setTravelSeconds] = useState<number | null>(null)
  const [travelDurationText, setTravelDurationText] = useState<string | null>(
    null,
  )
  const [travelProvider, setTravelProvider] = useState<
    'openrouteservice' | 'haversine' | null
  >(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

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
    } catch {
      setState('error')
      setErrorMessage('Unable to estimate travel time.')
      setTravelSeconds(null)
      setTravelDurationText(null)
      setTravelProvider(null)
    }
  }, [])

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setState('error')
      setErrorMessage('Geolocation is not supported by this browser.')
      return
    }

    setState('locating')
    setErrorMessage(null)

    navigator.geolocation.getCurrentPosition(
      (position) => {
        void requestNotificationPermission()
        void loadTravelTimes(
          position.coords.latitude,
          position.coords.longitude,
        )
      },
      (error) => {
        setTravelSeconds(null)
        setTravelDurationText(null)
        setTravelProvider(null)

        if (error.code === error.PERMISSION_DENIED) {
          setState('denied')
          setErrorMessage('Location access denied.')
        } else {
          setState('error')
          setErrorMessage('Unable to get your location.')
        }
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 },
    )
  }, [loadTravelTimes])

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
      requestLocation,
      evaluateTrip,
    }),
    [
      state,
      travelSeconds,
      travelDurationText,
      travelProvider,
      errorMessage,
      requestLocation,
      evaluateTrip,
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
