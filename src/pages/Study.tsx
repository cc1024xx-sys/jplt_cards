import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Flashcard } from '../components/Flashcard'
import { getAllCards, getCardsByDeck, saveCard } from '../lib/db'
import { applyFamiliarity, sortForReview } from '../lib/review-scheduler'
import { LinkedCardsSection } from '../components/LinkedCardsSection'
import { type Card, type CardType, type Familiarity } from '../lib/types'

export function Study() {
  const [searchParams] = useSearchParams()
  const deckId = searchParams.get('deck')
  const typeFilter = searchParams.get('type') as CardType | null

  const [queue, setQueue] = useState<Card[]>([])
  const [allCards, setAllCards] = useState<Card[]>([])
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
      const universe = await getAllCards()
      setAllCards(universe)
      if (typeFilter) {
        cards = cards.filter((c) => c.type === typeFilter)
      }
      const sorted = sortForReview(cards)
      setQueue(sorted)
      setIndex(0)
      setDone(sorted.length === 0)
      setLoading(false)
    }
    void load()
  }, [deckId, typeFilter])

  const current = queue[index]

  const linkedCards = useMemo(() => {
    if (!current) return []
    return (current.linkedCardIds ?? [])
      .map((id) => allCards.find((card) => card.id === id))
      .filter((card): card is Card => Boolean(card))
  }, [current, allCards])

  const goToIndex = useCallback((nextIndex: number) => {
    if (nextIndex < 0 || nextIndex >= queue.length) return
    setIndex(nextIndex)
    setDone(false)
  }, [queue.length])

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

      setQueue((prev) => prev.map((c, i) => (i === index ? updated : c)))
      setAllCards((prev) => prev.map((c) => (c.id === updated.id ? updated : c)))

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

      <div className="mt-3 flex items-center justify-center gap-3">
        <button
          type="button"
          disabled={index === 0}
          onClick={() => goToIndex(index - 1)}
          className="rounded-lg border border-card-border bg-white px-4 py-2 text-sm text-sumi disabled:cursor-not-allowed disabled:opacity-40 hover:bg-washi"
        >
          上一张
        </button>
        <button
          type="button"
          disabled={index >= queue.length - 1}
          onClick={() => goToIndex(index + 1)}
          className="rounded-lg border border-card-border bg-white px-4 py-2 text-sm text-sumi disabled:cursor-not-allowed disabled:opacity-40 hover:bg-washi"
        >
          下一张
        </button>
      </div>

      <div className="mt-5">
        <LinkedCardsSection cards={linkedCards} />
      </div>
    </div>
  )
}
