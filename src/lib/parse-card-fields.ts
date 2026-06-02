import type { ExamplePair } from './types'

const PAIR_SEPARATORS = ['｜', '|', '：', ':', '\t'] as const

export function parsePairLine(line: string): ExamplePair | null {
  const trimmed = line.trim()
  if (!trimmed) return null

  for (const sep of PAIR_SEPARATORS) {
    const idx = trimmed.indexOf(sep)
    if (idx > 0) {
      const ja = trimmed.slice(0, idx).trim()
      const zh = trimmed.slice(idx + sep.length).trim()
      if (ja && zh) return { ja, zh }
    }
  }
  return null
}

export function parseExampleLines(text: string): ExamplePair[] {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => parsePairLine(line))
    .filter((x): x is ExamplePair => x !== null)
}

export function countInvalidExampleLines(text: string): number {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => parsePairLine(line) === null).length
}

export function formatExampleLines(examples: ExamplePair[]): string {
  return examples.map((e) => `${e.ja}|${e.zh}`).join('\n')
}
