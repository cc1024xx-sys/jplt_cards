import type { Familiarity } from '../lib/types'

interface FamiliarityBarProps {
  onSelect: (f: Familiarity) => void
  disabled?: boolean
}

const buttons: { value: Familiarity; label: string; className: string }[] = [
  { value: 'mastered', label: '掌握', className: 'bg-matcha/15 text-matcha-deep border-matcha/40 hover:bg-matcha/25' },
  { value: 'familiar', label: '熟悉', className: 'bg-familiar/15 text-indigo-ja border-familiar/40 hover:bg-familiar/25' },
  { value: 'unfamiliar', label: '不熟', className: 'bg-unfamiliar/15 text-sakura-deep border-unfamiliar/40 hover:bg-unfamiliar/25' },
]

export function FamiliarityBar({ onSelect, disabled }: FamiliarityBarProps) {
  return (
    <div className="flex gap-2">
      {buttons.map((btn) => (
        <button
          key={btn.value}
          type="button"
          disabled={disabled}
          onClick={() => onSelect(btn.value)}
          className={`flex-1 rounded-lg border py-3 text-sm font-medium transition-colors disabled:opacity-50 ${btn.className}`}
        >
          {btn.label}
        </button>
      ))}
    </div>
  )
}
