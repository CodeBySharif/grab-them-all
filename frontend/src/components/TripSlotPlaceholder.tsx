import { TRIP_SLOT_HEIGHT } from '../utils/scheduleLayout'

function TripSlotPlaceholder() {
  return (
    <div
      className={`${TRIP_SLOT_HEIGHT} border-b border-hairline last:border-b-0`}
      aria-hidden="true"
    />
  )
}

export { TripSlotPlaceholder }
