import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { deleteDeck, getCardsByDeck, getDeck } from '../lib/db'
import { FAMILIARITY_LABELS, type Card } from '../lib/types'

export function DeckDetail() {
  const { deckId } = useParams<{ deckId: string }>()
  const navigate = useNavigate()
  const [deckName, setDeckName] = useState('')
  const [cards, setCards] = useState<Card[]>([])

  useEffect(() => {
    if (!deckId) return
    getDeck(deckId).then((d) => setDeckName(d?.name ?? ''))
    getCardsByDeck(deckId).then(setCards)
  }, [deckId])

  const handleDeleteDeck = async () => {
    if (!deckId || !confirm('确定删除此牌组及其中所有卡片？')) return
    await deleteDeck(deckId)
    navigate('/decks')
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-medium">{deckName || '牌组'}</h1>
        <Link
          to={`/study?deck=${deckId}`}
          className="rounded-lg bg-indigo-ja-dark px-3 py-1.5 text-sm text-white no-underline"
        >
          学习
        </Link>
      </div>

      <Link
        to={`/cards/new?deckId=${deckId}`}
        className="block rounded-xl border border-dashed border-sakura/50 py-3 text-center text-sm text-sakura-deep no-underline"
      >
        ＋ 添加卡片到此牌组
      </Link>

      {cards.length === 0 ? (
        <p className="text-center text-sm text-sumi-muted">此牌组暂无卡片</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {cards.map((card) => (
            <li key={card.id}>
              <Link
                to={`/cards/${card.id}/edit`}
                className="flex items-center justify-between rounded-lg border border-card-border bg-white px-3 py-2 no-underline"
              >
                <CardPreview card={card} />
                <span className="text-xs text-sumi-muted">
                  {FAMILIARITY_LABELS[card.review.familiarity]}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <button
        type="button"
        onClick={handleDeleteDeck}
        className="mt-4 text-sm text-unfamiliar hover:underline"
      >
        删除牌组
      </button>
    </div>
  )
}

function CardPreview({ card }: { card: Card }) {
  if (card.type === 'vocabulary') return <span>{card.front.meaningZh}</span>
  if (card.type === 'grammar') return <span>{card.front.pattern}</span>
  return <span>{card.front.scenario}</span>
}
