import type { CorpusPhrase, CorpusWord } from './types'

const PAIR_SEPARATORS = ['｜', '|', '：', ':', '\t'] as const

function splitDelimitedLine(line: string): string[] | null {
  const trimmed = line.trim()
  if (!trimmed) return null
  for (const sep of PAIR_SEPARATORS) {
    if (trimmed.includes(sep)) {
      const parts = trimmed.split(sep).map((s) => s.trim()).filter((s) => s.length > 0)
      if (parts.length >= 2) return parts
    }
  }
  return null
}

export function parseCorpusWordLine(line: string): CorpusWord | null {
  const parts = splitDelimitedLine(line)
  if (!parts || parts.length < 2) return null
  const [ja, zh, reading] = parts
  if (!ja || !zh) return null
  return { ja, zh, reading: reading || undefined }
}

export function parseCorpusPhraseLine(line: string): CorpusPhrase | null {
  const parts = splitDelimitedLine(line)
  if (!parts || parts.length < 2) return null
  const [ja, zh, note] = parts
  if (!ja || !zh) return null
  return { ja, zh, note: note || undefined }
}

export function parseCorpusWordLines(text: string): CorpusWord[] {
  return text
    .split('\n')
    .map((line) => parseCorpusWordLine(line))
    .filter((x): x is CorpusWord => x !== null)
}

export function parseCorpusPhraseLines(text: string): CorpusPhrase[] {
  return text
    .split('\n')
    .map((line) => parseCorpusPhraseLine(line))
    .filter((x): x is CorpusPhrase => x !== null)
}

export function countInvalidCorpusWordLines(text: string): number {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => parseCorpusWordLine(line) === null).length
}

export function countInvalidCorpusPhraseLines(text: string): number {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => parseCorpusPhraseLine(line) === null).length
}
