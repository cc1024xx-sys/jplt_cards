import { useState } from 'react'
import type { Card } from '../lib/types'
import { CARD_TYPE_LABELS } from '../lib/types'
import { CardBack, CardFront, useCardCopy } from './CardFaces'

interface FlashcardPreviewProps {
  card: Card
}

export function FlashcardPreview({ card }: FlashcardPreviewProps) {
  const [flipped, setFlipped] = useState(false)
  const { copiedKey, handleCopy } = useCardCopy()

  const handleFlip = () => setFlipped((prev) => !prev)

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-end">
        <span className="rounded-full bg-indigo-ja/10 px-2 py-0.5 text-xs text-indigo-ja-dark">
          {CARD_TYPE_LABELS[card.type]}
        </span>
      </div>

      <button
        type="button"
        onClick={handleFlip}
        className="min-h-[280px] w-full cursor-pointer rounded-2xl border border-card-border bg-white p-6 text-left shadow-sm transition-shadow hover:shadow-md focus:outline-none focus:ring-2 focus:ring-sakura/50"
      >
        {!flipped ? (
          <CardFront card={card} copiedKey={copiedKey} onCopy={handleCopy} />
        ) : (
          <CardBack card={card} copiedKey={copiedKey} onCopy={handleCopy} />
        )}
      </button>

      <p className="text-center text-sm text-sumi-muted">
        {flipped ? '点击卡片返回正面' : '点击卡片查看背面'}
      </p>
    </div>
  )
}
