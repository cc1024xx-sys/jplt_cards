interface PitfallsFieldsProps {
  value: string
  onChange: (value: string) => void
}

export function PitfallsFields({ value, onChange }: PitfallsFieldsProps) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-sm text-sumi-muted">易混/考点（每行一条，可选）</span>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
        placeholder="易混词、常见误用、考试重点等"
        className="rounded-lg border border-card-border bg-white px-3 py-2"
      />
    </label>
  )
}
