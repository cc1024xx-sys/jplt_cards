import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  deleteDeck,
  getCardsByDeck,
  getDeck,
  linkCards,
  searchCards,
  unlinkCards,
} from '../lib/db'
import { FAMILIARITY_LABELS, getCardFrontText, type Card } from '../lib/types'

export function DeckDetail() {
  const { deckId } = useParams<{ deckId: string }>()
  const navigate = useNavigate()
  const [deckName, setDeckName] = useState('')
  const [cards, setCards] = useState<Card[]>([])
  const [search, setSearch] = useState('')
  const [allCards, setAllCards] = useState<Card[]>([])
  const [linkingCardId, setLinkingCardId] = useState<string | null>(null)
  const [linkQuery, setLinkQuery] = useState('')

  const loadDeckCards = async () => {
    if (!deckId) return
    const list = await getCardsByDeck(deckId)
    setCards(list)
  }

  useEffect(() => {
    if (!deckId) return
    getDeck(deckId).then((d) => setDeckName(d?.name ?? ''))
    void loadDeckCards()
    searchCards('').then(setAllCards)
  }, [deckId])

  const handleDeleteDeck = async () => {
    if (!deckId || !confirm('确定删除此牌组及其中所有卡片？')) return
    await deleteDeck(deckId)
    navigate('/decks')
  }

  const filteredCards = useMemo(() => {
    const keyword = search.trim().toLowerCase()
    if (!keyword) return cards
    return cards.filter((card) =>
      `${getCardFrontText(card)} ${card.tags.join(' ')}`.toLowerCase().includes(keyword),
    )
  }, [cards, search])

  const linkingCard = useMemo(
    () => cards.find((card) => card.id === linkingCardId) ?? null,
    [cards, linkingCardId],
  )

  const candidates = useMemo(() => {
    if (!linkingCard) return []
    const keyword = linkQuery.trim().toLowerCase()
    return allCards
      .filter((card) => card.id !== linkingCard.id)
      .filter((card) => card.type === linkingCard.type)
      .filter((card) =>
        keyword
          ? `${getCardFrontText(card)} ${card.tags.join(' ')}`.toLowerCase().includes(keyword)
          : true,
      )
      .slice(0, 30)
  }, [allCards, linkingCard, linkQuery])

  const handleLink = async (targetId: string) => {
    if (!linkingCard) return
    const linked = linkingCard.linkedCardIds.includes(targetId)
    if (linked) {
      await unlinkCards(linkingCard.id, targetId)
    } else {
      await linkCards(linkingCard.id, targetId)
    }
    await loadDeckCards()
    const freshAll = await searchCards('')
    setAllCards(freshAll)
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

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="搜索卡片（中文/日文/标签）"
        className="rounded-lg border border-card-border bg-white px-3 py-2"
      />

      {cards.length === 0 ? (
        <p className="text-center text-sm text-sumi-muted">此牌组暂无卡片</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {filteredCards.map((card) => (
            <li key={card.id}>
              <div className="rounded-lg border border-card-border bg-white px-3 py-2">
                <div className="flex items-start justify-between gap-2">
                  <Link
                    to={`/cards/${card.id}/edit`}
                    className="min-w-0 flex-1 no-underline"
                  >
                    <CardPreview card={card} />
                  </Link>
                  <span className="shrink-0 text-xs text-sumi-muted">
                    {FAMILIARITY_LABELS[card.review.familiarity]}
                  </span>
                </div>
                <div className="mt-2 flex items-center justify-between text-xs">
                  <span className="text-sumi-muted">
                    已关联 {card.linkedCardIds.length} 张
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setLinkingCardId(card.id)
                      setLinkQuery('')
                    }}
                    className="rounded border border-card-border px-2 py-1 text-indigo-ja-dark hover:bg-washi"
                  >
                    关联对比
                  </button>
                </div>
              </div>
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

      {linkingCard && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-sumi/30 px-4">
          <div className="max-h-[80vh] w-full max-w-xl overflow-auto rounded-xl bg-white p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-base font-medium">
                关联卡片：{getCardFrontText(linkingCard)}
              </h2>
              <button
                type="button"
                onClick={() => setLinkingCardId(null)}
                className="text-sm text-sumi-muted hover:text-sumi"
              >
                关闭
              </button>
            </div>
            <p className="mb-2 text-xs text-sumi-muted">
              仅显示同类型卡片：{linkingCard.type}
            </p>
            <input
              value={linkQuery}
              onChange={(e) => setLinkQuery(e.target.value)}
              placeholder="搜索要关联的卡片"
              className="mb-3 w-full rounded-lg border border-card-border bg-white px-3 py-2"
            />
            <div className="space-y-2">
              {candidates.map((candidate) => {
                const linked = linkingCard.linkedCardIds.includes(candidate.id)
                return (
                  <div
                    key={candidate.id}
                    className="flex items-center justify-between rounded-lg border border-card-border px-3 py-2"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm">{getCardFrontText(candidate)}</p>
                      <p className="text-xs text-sumi-muted">{candidate.type}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => void handleLink(candidate.id)}
                      className={`rounded px-2 py-1 text-xs ${
                        linked
                          ? 'bg-unfamiliar/10 text-sakura-deep'
                          : 'bg-indigo-ja/10 text-indigo-ja-dark'
                      }`}
                    >
                      {linked ? '取消关联' : '关联'}
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function CardPreview({ card }: { card: Card }) {
  if (card.type === 'vocabulary') return <span>{card.front.meaningZh}</span>
  if (card.type === 'grammar') return <span>{card.front.pattern}</span>
  if (card.type === 'contrast') return <span>{card.front.title}</span>
  return <span>{card.front.scenario}</span>
}
