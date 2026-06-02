import { formatExampleText } from '../lib/example-text'
import type { ExamplePair } from '../lib/types'

export function ExampleLine({ ex }: { ex: ExamplePair }) {
  const text = formatExampleText(ex)
  if (!text.trim()) return null
  return (
    <p className="min-w-0 flex-1 break-words whitespace-pre-wrap text-sumi">{text}</p>
  )
}
