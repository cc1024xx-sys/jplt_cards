import { Link } from 'react-router-dom'
import type { Deck } from '../lib/types'
import { CARD_TYPE_LABELS } from '../lib/types'

interface DeckCardProps {
  deck: Deck
  cardCount: number
  japanesePreview?: string
}

export function DeckCard({ deck, cardCount, japanesePreview }: DeckCardProps) {
  const typeColors: Record<string, string> = {
    vocabulary: 'bg-sakura/20 text-sakura-deep',
    grammar: 'bg-indigo-ja/15 text-indigo-ja-dark',
    corpus: 'bg-matcha/20 text-matcha-deep',
  }

  return (
    <Link
      to={`/decks/${deck.id}`}
      className="block rounded-xl border border-card-border bg-white p-4 no-underline shadow-sm transition-shadow hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-medium text-sumi">{deck.name}</h3>
        <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs ${typeColors[deck.cardType]}`}>
          {CARD_TYPE_LABELS[deck.cardType]}
        </span>
      </div>
      {japanesePreview && (
        <p className="mt-2 text-sm text-indigo-ja-dark line-clamp-1">
          日语表达：{japanesePreview}
        </p>
      )}
      <p className="mt-2 text-xs text-sumi-muted">{cardCount} 张卡片</p>
    </Link>
  )
}
