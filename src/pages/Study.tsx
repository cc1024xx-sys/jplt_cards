import { useCallback, useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Flashcard } from '../components/Flashcard'
import { getAllCards, getCardsByDeck, saveCard } from '../lib/db'
import { applyFamiliarity, sortForReview } from '../lib/review-scheduler'
import type { Card, CardType, Familiarity } from '../lib/types'

export function Study() {
  const [searchParams] = useSearchParams()
  const deckId = searchParams.get('deck')
  const typeFilter = searchParams.get('type') as CardType | null

  const [queue, setQueue] = useState<Card[]>([])
  const [index, setIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [done, setDone] = useState(false)

  useEffect(() => {
    async function load() {
      let cards: Card[]
      if (deckId) {
        cards = await getCardsByDeck(deckId)
      } else {
        cards = await getAllCards()
      }
      if (typeFilter) {
        cards = cards.filter((c) => c.type === typeFilter)
      }
      const sorted = sortForReview(cards)
      setQueue(sorted)
      setIndex(0)
      setDone(sorted.length === 0)
      setLoading(false)
    }
    load()
  }, [deckId, typeFilter])

  const handleRate = useCallback(
    async (familiarity: Familiarity) => {
      const card = queue[index]
      if (!card) return

      const updated: Card = {
        ...card,
        review: applyFamiliarity(card.review, familiarity),
        updatedAt: new Date().toISOString(),
      }
      await saveCard(updated)

      const nextIndex = index + 1
      if (nextIndex >= queue.length) {
        setDone(true)
      } else {
        setIndex(nextIndex)
      }
    },
    [queue, index],
  )

  if (loading) {
    return <p className="text-center text-sumi-muted">准备卡片…</p>
  }

  if (done || queue.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 py-12 text-center">
        <p className="text-4xl text-sakura" aria-hidden>
          ✓
        </p>
        <h2 className="text-xl font-medium">
          {queue.length === 0 ? '暂无待复习卡片' : '本轮复习完成'}
        </h2>
        <Link to="/" className="text-indigo-ja-dark no-underline hover:underline">
          返回首页
        </Link>
      </div>
    )
  }

  const current = queue[index]
  if (!current) return null

  return (
    <div>
      <Link to="/" className="mb-4 inline-block text-sm text-sumi-muted no-underline hover:text-sumi">
        ← 返回
      </Link>
      <Flashcard
        key={`${current.id}-${index}`}
        card={current}
        index={index}
        total={queue.length}
        onRate={handleRate}
      />
    </div>
  )
}
