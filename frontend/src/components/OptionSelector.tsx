import type { TransportOption } from '../types/schedule'

interface OptionSelectorProps {
  value: TransportOption
  onChange: (value: TransportOption) => void
}

const options: { value: TransportOption; label: string }[] = [
  { value: 'ferry', label: 'Ferry' },
  { value: 'flight', label: 'Flight' },
]

export function OptionSelector({ value, onChange }: OptionSelectorProps) {
  return (
    <div className="inline-flex gap-1 rounded-pill bg-canvas p-1">
      {options.map((option) => {
        const isSelected = value === option.value

        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={[
              'rounded-pill px-3.5 py-1.5 text-sm font-medium transition-colors',
              isSelected
                ? 'bg-surface-2 text-ink'
                : 'text-ink-subtle hover:text-ink-muted',
            ].join(' ')}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
