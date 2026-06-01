import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { DeckCard } from '../components/DeckCard'
import { getAllDecks, getCardsByDeck } from '../lib/db'
import type { Deck } from '../lib/types'

export function Decks() {
  const [decks, setDecks] = useState<Deck[]>([])
  const [counts, setCounts] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const list = await getAllDecks()
      setDecks(list)
      const c: Record<string, number> = {}
      for (const d of list) {
        const cards = await getCardsByDeck(d.id)
        c[d.id] = cards.length
      }
      setCounts(c)
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return <p className="text-center text-sumi-muted">加载中…</p>

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-medium">牌组</h1>
        <Link
          to="/decks/new"
          className="rounded-lg bg-sakura/30 px-3 py-1.5 text-sm text-sakura-deep no-underline hover:bg-sakura/40"
        >
          新建牌组
        </Link>
      </div>

      {decks.length === 0 ? (
        <div className="rounded-xl border border-dashed border-card-border py-12 text-center">
          <p className="text-sumi-muted">还没有牌组</p>
          <Link to="/decks/new" className="mt-2 inline-block text-indigo-ja-dark no-underline">
            创建第一个牌组
          </Link>
        </div>
      ) : (
        <div className="grid gap-3">
          {decks.map((deck) => (
            <DeckCard key={deck.id} deck={deck} cardCount={counts[deck.id] ?? 0} />
          ))}
        </div>
      )}
    </div>
  )
}
