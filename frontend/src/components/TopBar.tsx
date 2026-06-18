import { OptionSelector } from './OptionSelector'
import type { TransportOption } from '../types/schedule'

interface TopBarProps {
  dayLabel: string
  dateLabel: string
  option: TransportOption
  onOptionChange: (value: TransportOption) => void
}

export function TopBar({
  dayLabel,
  dateLabel,
  option,
  onOptionChange,
}: TopBarProps) {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-hairline bg-canvas">
      <div className="mx-auto max-w-7xl px-4 py-3">
        <div className="flex items-center justify-between text-sm">
          <span className="font-semibold tracking-wide text-ink">{dayLabel}</span>
          <span className="text-ink-muted">{dateLabel}</span>
        </div>
        <div className="mt-3 flex justify-center">
          <OptionSelector value={option} onChange={onOptionChange} />
        </div>
      </div>
    </header>
  )
}
