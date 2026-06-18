import type { ArrivalStatus } from '../types/estimation'

interface ArrivalIndicatorProps {
  status: ArrivalStatus | 'unavailable' | 'loading'
}

const config: Record<
  ArrivalStatus | 'unavailable' | 'loading',
  { label: string; dotClass: string; textClass: string }
> = {
  yes: {
    label: 'Yes',
    dotClass: 'bg-semantic-success',
    textClass: 'text-semantic-success',
  },
  no: {
    label: 'No',
    dotClass: 'bg-red-500',
    textClass: 'text-red-400',
  },
  past: {
    label: 'Past',
    dotClass: 'bg-ink-tertiary',
    textClass: 'text-ink-tertiary',
  },
  unavailable: {
    label: '—',
    dotClass: 'bg-ink-tertiary',
    textClass: 'text-ink-tertiary',
  },
  loading: {
    label: '…',
    dotClass: 'bg-ink-tertiary animate-pulse',
    textClass: 'text-ink-tertiary',
  },
}

export function ArrivalIndicator({ status }: ArrivalIndicatorProps) {
  const { label, dotClass, textClass } = config[status]

  return (
    <span
      className={`inline-flex items-center gap-1 text-[10px] font-medium ${textClass}`}
      title={
        status === 'yes'
          ? 'You can reach the terminal in time'
          : status === 'no'
            ? 'You may not reach the terminal in time'
            : undefined
      }
    >
      <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${dotClass}`} />
      {label}
    </span>
  )
}
