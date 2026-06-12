import type { Card, CorpusCard } from './types'

type LegacyCorpusCollocation = {
  wordJa: string
  ja: string
  zh: string
  note?: string
}

type LegacyCorpusBack = CorpusCard['back'] & {
  collocations?: LegacyCorpusCollocation[]
}

export function migrateCorpusCard(card: Card): Card {
  if (card.type !== 'corpus') return card

  const back = card.back as LegacyCorpusBack
  const legacy = back.collocations ?? []
  if (legacy.length === 0) return card

  const words = back.words.map((word) => ({
    ...word,
    collocations: [...(word.collocations ?? [])],
  }))

  for (const item of legacy) {
    const word = words.find((w) => w.ja === item.wordJa)
    const collocation = {
      ja: item.ja,
      zh: item.zh,
      note: item.note,
    }
    if (word) {
      word.collocations = [...(word.collocations ?? []), collocation]
    }
  }

  const { collocations: _removed, ...rest } = back
  return {
    ...card,
    back: {
      ...rest,
      words,
    },
  }
}
