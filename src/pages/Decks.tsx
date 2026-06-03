import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { FlashcardPreview } from '../components/FlashcardPreview'
import { LinkedCardsSection } from '../components/LinkedCardsSection'
import { deleteCard, getAllDecks, getCardsByDeck, linkCards, unlinkCards } from '../lib/db'
import {
  CARD_TYPE_LABELS,
  FAMILIARITY_LABELS,
  getCardBrief,
  type Card,
  type CardType,
  type Deck,
} from '../lib/types'

export function Decks() {
  const [decks, setDecks] = useState<Deck[]>([])
  const [cards, setCards] = useState<Card[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [linkingCardId, setLinkingCardId] = useState<string | null>(null)
  const [viewingCardId, setViewingCardId] = useState<string | null>(null)
  const [linkQuery, setLinkQuery] = useState('')
  const [collapsed, setCollapsed] = useState<Record<CardType, boolean>>({
    vocabulary: true,
    grammar: true,
    corpus: true,
    contrast: true,
  })

  useEffect(() => {
    async function load() {
      const list = await getAllDecks()
      setDecks(list)
      const allCards: Card[] = []
      for (const d of list) {
        const deckCards = await getCardsByDeck(d.id)
        allCards.push(...deckCards)
      }
      setCards(allCards)
      setLoading(false)
    }
    void load()
  }, [])

  const filteredCards = useMemo(() => {
    const keyword = search.trim().toLowerCase()
    if (!keyword) return cards
    return cards.filter((card) => {
      const brief = getCardBrief(card)
      const text = `${brief.ja} ${brief.zh}`
      return text.toLowerCase().includes(keyword)
    })
  }, [cards, search])

  const groupedCards = useMemo(() => {
    const base: Record<CardType, Card[]> = {
      vocabulary: [],
      grammar: [],
      corpus: [],
      contrast: [],
    }
    for (const card of filteredCards) {
      base[card.type].push(card)
    }
    return base
  }, [filteredCards])

  const decksByType = useMemo(() => {
    const base: Record<CardType, Deck[]> = {
      vocabulary: [],
      grammar: [],
      corpus: [],
      contrast: [],
    }
    for (const deck of decks) {
      base[deck.cardType].push(deck)
    }
    return base
  }, [decks])

  const groupOrder: CardType[] = ['vocabulary', 'grammar', 'corpus', 'contrast']

  const toggleCollapse = (type: CardType) => {
    setCollapsed((prev) => ({ ...prev, [type]: !prev[type] }))
  }

  const linkingCard = useMemo(
    () => cards.find((card) => card.id === linkingCardId) ?? null,
    [cards, linkingCardId],
  )

  const viewingCard = useMemo(
    () => cards.find((card) => card.id === viewingCardId) ?? null,
    [cards, viewingCardId],
  )

  const viewingLinkedCards = useMemo(() => {
    if (!viewingCard) return []
    return (viewingCard.linkedCardIds ?? [])
      .map((id) => cards.find((card) => card.id === id))
      .filter((card): card is Card => Boolean(card))
  }, [viewingCard, cards])

  const candidates = useMemo(() => {
    if (!linkingCard) return []
    const keyword = linkQuery.trim().toLowerCase()
    return cards
      .filter((card) => card.id !== linkingCard.id)
      .filter((card) => card.type === linkingCard.type)
      .filter((card) => {
        if (!keyword) return true
        const brief = getCardBrief(card)
        return `${brief.ja} ${brief.zh}`.toLowerCase().includes(keyword)
      })
      .slice(0, 30)
  }, [cards, linkingCard, linkQuery])

  const refreshCards = async () => {
    const list = await getAllDecks()
    const allCards: Card[] = []
    for (const d of list) {
      const deckCards = await getCardsByDeck(d.id)
      allCards.push(...deckCards)
    }
    setCards(allCards)
  }

  const handleLink = async (targetId: string) => {
    if (!linkingCard) return
    const linked = linkingCard.linkedCardIds.includes(targetId)
    if (linked) {
      await unlinkCards(linkingCard.id, targetId)
    } else {
      await linkCards(linkingCard.id, targetId)
    }
    await refreshCards()
  }

  const handleDeleteCard = async (cardId: string) => {
    if (!confirm('确定删除这张闪卡？')) return
    await deleteCard(cardId)
    if (linkingCardId === cardId) setLinkingCardId(null)
    if (viewingCardId === cardId) setViewingCardId(null)
    await refreshCards()
  }

  if (loading) return <p className="text-center text-sumi-muted">加载中…</p>

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-medium">牌组</h1>
        <div className="flex items-center gap-2">
          <Link
            to="/decks/new"
            className="rounded-lg bg-sakura/30 px-3 py-1.5 text-sm text-sakura-deep no-underline hover:bg-sakura/40"
          >
            新建牌组
          </Link>
          <Link
            to="/decks/edit"
            className="rounded-lg border border-card-border bg-white px-3 py-1.5 text-sm text-sumi-muted no-underline hover:bg-washi"
          >
            编辑牌组
          </Link>
        </div>
      </div>

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="搜索日语表达 / 中文意思"
        className="rounded-lg border border-card-border bg-white px-3 py-2"
      />

      {decks.length === 0 ? (
        <div className="rounded-xl border border-dashed border-card-border py-12 text-center">
          <p className="text-sumi-muted">还没有牌组</p>
          <Link to="/decks/new" className="mt-2 inline-block text-indigo-ja-dark no-underline">
            创建第一个牌组
          </Link>
        </div>
      ) : filteredCards.length === 0 ? (
        <div className="rounded-xl border border-dashed border-card-border py-10 text-center">
          <p className="text-sumi-muted">没有匹配的牌组</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {groupOrder.map((type) => {
            const list = groupedCards[type]
            const isCollapsed = collapsed[type]
            return (
              <section key={type} className="rounded-xl border border-card-border bg-white">
                <div className="flex items-center gap-2 px-4 py-3">
                  <button
                    type="button"
                    onClick={() => toggleCollapse(type)}
                    className="flex min-w-0 flex-1 items-center justify-between text-left"
                  >
                    <div>
                      <p className="font-medium text-sumi">{CARD_TYPE_LABELS[type]}</p>
                      <p className="text-xs text-sumi-muted">{list.length} 张卡片</p>
                    </div>
                    <span className="shrink-0 pl-2 text-sumi-muted">
                      {isCollapsed ? '展开' : '收起'}
                    </span>
                  </button>
                  <Link
                    to={`/cards/new?type=${type}`}
                    onClick={(e) => e.stopPropagation()}
                    className="shrink-0 rounded border border-sakura/40 bg-sakura/10 px-2.5 py-1 text-xs text-sakura-deep no-underline hover:bg-sakura/20"
                  >
                    新建闪卡
                  </Link>
                </div>
                {!isCollapsed && (
                  <div className="space-y-2 border-t border-card-border p-3">
                    {decksByType[type].map((deck) => {
                      const deckCards = list.filter((card) => card.deckId === deck.id)
                      return (
                        <div key={deck.id} className="rounded-lg border border-card-border bg-white p-2">
                          <Link
                            to={`/decks/${deck.id}`}
                            className="mb-2 block truncate px-1 text-sm font-medium text-sumi no-underline hover:text-indigo-ja-dark"
                          >
                            {deck.name}
                          </Link>
                          <div className="space-y-2">
                            {deckCards.map((card) => {
                              const brief = getCardBrief(card)
                              return (
                                <div
                                  key={card.id}
                                  className="relative rounded-lg border border-card-border bg-washi/50 px-3 py-2"
                                >
                                  <button
                                    type="button"
                                    onClick={() => void handleDeleteCard(card.id)}
                                    className="absolute right-2 top-2 z-10 rounded border border-unfamiliar/40 px-1.5 py-0.5 text-[10px] text-sakura-deep hover:bg-unfamiliar/10"
                                    title="删除闪卡"
                                    aria-label="删除闪卡"
                                  >
                                    ×
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setViewingCardId(card.id)}
                                    className="w-full cursor-pointer rounded-md pr-8 text-left transition-colors hover:bg-washi/80"
                                  >
                                    <p className="text-sm text-sumi">{brief.ja}</p>
                                    <p className="mt-0.5 text-sm text-sumi-muted">{brief.zh}</p>
                                  </button>
                                  <div className="mt-1 flex items-center justify-between">
                                    <p className="text-xs text-indigo-ja-dark">
                                      熟悉程度：{FAMILIARITY_LABELS[card.review.familiarity]}
                                    </p>
                                    <div className="flex items-center gap-2">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setLinkingCardId(card.id)
                                          setLinkQuery('')
                                        }}
                                        className="rounded border border-card-border px-2 py-1 text-xs text-indigo-ja-dark hover:bg-white"
                                      >
                                        关联对比
                                      </button>
                                      <Link
                                        to={`/cards/${card.id}/edit`}
                                        className="rounded border border-card-border px-2 py-1 text-xs text-sumi-muted no-underline hover:bg-white"
                                      >
                                        编辑
                                      </Link>
                                    </div>
                                  </div>
                                </div>
                              )
                            })}
                            {deckCards.length === 0 && (
                              <p className="px-1 text-xs text-sumi-muted">此牌组暂无闪卡</p>
                            )}
                          </div>
                        </div>
                      )
                    })}
                    {decksByType[type].length === 0 && (
                      <p className="text-sm text-sumi-muted">暂无牌组</p>
                    )}
                  </div>
                )}
              </section>
            )
          })}
        </div>
      )}

      {viewingCard && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-sumi/30 px-4 py-6"
          onClick={() => setViewingCardId(null)}
          role="presentation"
        >
          <div
            className="max-h-[90vh] w-full max-w-lg overflow-auto rounded-xl bg-washi p-4 shadow-lg"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="card-view-title"
          >
            <div className="mb-3 flex items-center justify-between">
              <h2 id="card-view-title" className="text-base font-medium text-sumi">
                闪卡详情
              </h2>
              <button
                type="button"
                onClick={() => setViewingCardId(null)}
                className="text-sm text-sumi-muted hover:text-sumi"
              >
                关闭
              </button>
            </div>
            <FlashcardPreview
              key={viewingCard.id}
              card={viewingCard}
              frontOnly
              editHref={`/cards/${viewingCard.id}/edit`}
            />
            <div className="mt-4">
              <LinkedCardsSection
                cards={viewingLinkedCards}
                onCardClick={(card) => setViewingCardId(card.id)}
              />
            </div>
          </div>
        </div>
      )}

      {linkingCard && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-sumi/30 px-4">
          <div className="max-h-[80vh] w-full max-w-xl overflow-auto rounded-xl bg-white p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-base font-medium">
                关联卡片：{getCardBrief(linkingCard).ja}
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
              仅显示同类型卡片：{CARD_TYPE_LABELS[linkingCard.type]}
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
                const brief = getCardBrief(candidate)
                return (
                  <div
                    key={candidate.id}
                    className="flex items-center justify-between rounded-lg border border-card-border px-3 py-2"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm">{brief.ja}</p>
                      <p className="truncate text-xs text-sumi-muted">{brief.zh}</p>
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
              {candidates.length === 0 && (
                <p className="text-sm text-sumi-muted">没有可关联的同类型卡片</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
