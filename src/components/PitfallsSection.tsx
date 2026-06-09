interface PitfallsSectionProps {
  pitfalls: string[]
  className?: string
}

export function PitfallsSection({ pitfalls, className }: PitfallsSectionProps) {
  if (pitfalls.length === 0) return null

  return (
    <div className={className}>
      <p className="mb-1 text-xs font-medium text-sakura-deep">易混/考点</p>
      <ul className="list-inside list-disc text-sm text-sumi">
        {pitfalls.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ul>
    </div>
  )
}
