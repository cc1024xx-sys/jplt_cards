import { useState } from 'react'
import type { Card, Familiarity } from '../lib/types'
import { CardBack, CardFront } from './CardFaces'
import { FamiliarityBar } from './FamiliarityBar'

interface FlashcardProps {
  card: Card
  index: number
  total: number
  onRate: (familiarity: Familiarity) => void
}

export function Flashcard({ card, index, total, onRate }: FlashcardProps) {
  const [flipped, setFlipped] = useState(false)
  const [copiedKey, setCopiedKey] = useState<string | null>(null)

  const handleFlip = () => {
    if (!flipped) setFlipped(true)
  }

  const handleRate = (f: Familiarity) => {
    onRate(f)
    setFlipped(false)
  }

  const handleCopy = async (text: string, key: string) => {
    const value = text.trim()
    if (!value) return
    try {
      await navigator.clipboard.writeText(value)
      setCopiedKey(key)
      window.setTimeout(() => setCopiedKey((prev) => (prev === key ? null : prev)), 1200)
    } catch {
      window.alert('复制失败，请检查浏览器剪贴板权限')
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between text-sm text-sumi-muted">
        <span>
          {index + 1} / {total}
        </span>
        <span className="rounded-full bg-indigo-ja/10 px-2 py-0.5 text-indigo-ja-dark">
          {card.type === 'vocabulary' && '词语'}
          {card.type === 'grammar' && '语法'}
          {card.type === 'corpus' && '语料库'}
          {card.type === 'contrast' && '辨析'}
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

      {!flipped ? (
        <p className="text-center text-sm text-sumi-muted">点击卡片查看答案</p>
      ) : (
        <>
          <p className="text-center text-sm text-sumi-muted">
            标记熟悉程度后自动下一张，也可使用下方按钮手动切换
          </p>
          <FamiliarityBar onSelect={handleRate} />
        </>
      )}
    </div>
  )
}
