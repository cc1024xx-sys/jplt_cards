import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  deleteDeck,
  getCardsByDeck,
  getDeck,
  linkCards,
  saveCard,
  saveDeck,
  searchCards,
  unlinkCards,
} from '../lib/db'
import { Flashcard } from '../components/Flashcard'
import { LinkedCardsSection } from '../components/LinkedCardsSection'
import { applyFamiliarity } from '../lib/review-scheduler'
import {
  CARD_TYPE_LABELS,
  FAMILIARITY_LABELS,
  getCardFrontText,
  type Card,
  type Deck,
  type Familiarity,
} from '../lib/types'

export function DeckDetail() {
  const { deckId } = useParams<{ deckId: string }>()
  const navigate = useNavigate()
  const [deck, setDeck] = useState<Deck | null>(null)
  const [deckName, setDeckName] = useState('')
  const [isEditingName, setIsEditingName] = useState(false)
  const [nameDraft, setNameDraft] = useState('')
  const [cards, setCards] = useState<Card[]>([])
  const [search, setSearch] = useState('')
  const [allCards, setAllCards] = useState<Card[]>([])
  const [linkingCardId, setLinkingCardId] = useState<string | null>(null)
  const [linkQuery, setLinkQuery] = useState('')
  const [viewingCardId, setViewingCardId] = useState<string | null>(null)

  const loadDeckCards = async () => {
    if (!deckId) return
    const list = await getCardsByDeck(deckId)
    setCards(list)
  }

  useEffect(() => {
    if (!deckId) return
    getDeck(deckId).then((d) => {
      if (!d) {
        navigate('/decks')
        return
      }
      setDeck(d)
      setDeckName(d.name)
      setNameDraft(d.name)
    })
    void loadDeckCards()
    searchCards('').then(setAllCards)
  }, [deckId, navigate])

  const handleSaveName = async () => {
    if (!deck || !nameDraft.trim()) return
    const trimmed = nameDraft.trim()
    if (trimmed === deck.name) {
      setIsEditingName(false)
      return
    }
    const updated: Deck = {
      ...deck,
      name: trimmed,
      updatedAt: new Date().toISOString(),
    }
    const savedId = await saveDeck(updated)
    if (savedId !== deck.id) {
      navigate(`/decks/${savedId}`, { replace: true })
      return
    }
    setDeck(updated)
    setDeckName(trimmed)
    setNameDraft(trimmed)
    setIsEditingName(false)
  }

  const handleCancelNameEdit = () => {
    setNameDraft(deckName)
    setIsEditingName(false)
  }

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

  const viewingCard = useMemo(
    () => allCards.find((card) => card.id === viewingCardId) ?? null,
    [allCards, viewingCardId],
  )

  const viewingLinkedCards = useMemo(() => {
    if (!viewingCard) return []
    return (viewingCard.linkedCardIds ?? [])
      .map((id) => allCards.find((card) => card.id === id))
      .filter((card): card is Card => Boolean(card))
  }, [viewingCard, allCards])

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

  const handleViewingRate = async (familiarity: Familiarity) => {
    if (!viewingCard) return
    const updated: Card = {
      ...viewingCard,
      review: applyFamiliarity(viewingCard.review, familiarity),
      updatedAt: new Date().toISOString(),
    }
    await saveCard(updated)
    setCards((prev) => prev.map((c) => (c.id === updated.id ? updated : c)))
    setAllCards((prev) => prev.map((c) => (c.id === updated.id ? updated : c)))
  }

  const newCardHref = deckId ? `/cards/new?deckId=${deckId}` : '/cards/new'

  return (
    <div className="flex flex-col gap-4">
      <Link
        to="/decks"
        className="text-sm text-sumi-muted no-underline hover:text-indigo-ja-dark"
      >
        ← 返回牌组列表
      </Link>

      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          {isEditingName ? (
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <input
                value={nameDraft}
                onChange={(e) => setNameDraft(e.target.value)}
                placeholder="牌组名称"
                className="min-w-0 flex-1 rounded-lg border border-card-border bg-white px-3 py-2 text-base"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') void handleSaveName()
                  if (e.key === 'Escape') handleCancelNameEdit()
                }}
              />
              <div className="flex shrink-0 gap-2">
                <button
                  type="button"
                  onClick={() => void handleSaveName()}
                  disabled={!nameDraft.trim()}
                  className="rounded-lg bg-indigo-ja-dark px-3 py-1.5 text-sm text-white disabled:opacity-50"
                >
                  保存
                </button>
                <button
                  type="button"
                  onClick={handleCancelNameEdit}
                  className="rounded-lg border border-card-border px-3 py-1.5 text-sm text-sumi-muted"
                >
                  取消
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-medium text-sumi">{deckName || '牌组'}</h1>
              {deck && (
                <span className="rounded-full bg-washi px-2 py-0.5 text-xs text-sumi-muted">
                  {CARD_TYPE_LABELS[deck.cardType]}
                </span>
              )}
              <button
                type="button"
                onClick={() => setIsEditingName(true)}
                className="rounded border border-card-border px-2 py-0.5 text-xs text-indigo-ja-dark hover:bg-washi"
              >
                修改名称
              </button>
            </div>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Link
            to={newCardHref}
            className="rounded-lg border border-sakura/50 bg-sakura/15 px-3 py-1.5 text-sm text-sakura-deep no-underline hover:bg-sakura/25"
          >
            新建闪卡
          </Link>
          <Link
            to={`/study?deck=${deckId}`}
            className="rounded-lg bg-indigo-ja-dark px-3 py-1.5 text-sm text-white no-underline hover:bg-indigo-ja"
          >
            学习
          </Link>
        </div>
      </div>

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="搜索卡片（中文/日文/标签）"
        className="rounded-lg border border-card-border bg-white px-3 py-2"
      />

      {cards.length === 0 ? (
        <div className="rounded-xl border border-dashed border-card-border py-12 text-center">
          <p className="text-sm text-sumi-muted">此牌组暂无闪卡</p>
          <Link
            to={newCardHref}
            className="mt-3 inline-block rounded-lg border border-sakura/50 bg-sakura/15 px-4 py-2 text-sm text-sakura-deep no-underline hover:bg-sakura/25"
          >
            ＋ 新建闪卡
          </Link>
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {filteredCards.map((card) => (
            <li key={card.id}>
              <div className="rounded-lg border border-card-border bg-white px-3 py-2">
                <div className="flex items-start justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => setViewingCardId(card.id)}
                    className="min-w-0 flex-1 cursor-pointer rounded-md text-left transition-colors hover:bg-washi/80"
                  >
                    <CardPreview card={card} />
                  </button>
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
            aria-labelledby="deck-card-view-title"
          >
            <div className="mb-3 flex items-center justify-between gap-2">
              <h2 id="deck-card-view-title" className="text-base font-medium text-sumi">
                复习
              </h2>
              <div className="flex items-center gap-2">
                <Link
                  to={`/cards/${viewingCard.id}/edit`}
                  className="rounded border border-card-border bg-white px-2 py-1 text-xs text-indigo-ja-dark no-underline hover:bg-washi"
                >
                  编辑
                </Link>
                <button
                  type="button"
                  onClick={() => setViewingCardId(null)}
                  className="text-sm text-sumi-muted hover:text-sumi"
                >
                  关闭
                </button>
              </div>
            </div>
            <Flashcard
              key={`${viewingCard.id}-${viewingCard.updatedAt}`}
              card={viewingCard}
              index={0}
              total={1}
              compact
              onRate={(f) => void handleViewingRate(f)}
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
