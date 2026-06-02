import { useMemo, useState } from 'react'
import { linkCards, unlinkCards } from '../lib/db'
import { CARD_TYPE_LABELS, getCardBrief, type Card } from '../lib/types'

interface LinkCardsModalProps {
  card: Card
  allCards: Card[]
  onClose: () => void
  onLinksChanged: () => void | Promise<void>
}

export function LinkCardsModal({ card, allCards, onClose, onLinksChanged }: LinkCardsModalProps) {
  const [linkQuery, setLinkQuery] = useState('')

  const candidates = useMemo(() => {
    const keyword = linkQuery.trim().toLowerCase()
    return allCards
      .filter((c) => c.id !== card.id)
      .filter((c) => c.type === card.type)
      .filter((c) => {
        if (!keyword) return true
        const brief = getCardBrief(c)
        return `${brief.ja} ${brief.zh}`.toLowerCase().includes(keyword)
      })
      .slice(0, 30)
  }, [allCards, card, linkQuery])

  const handleLink = async (targetId: string) => {
    const linked = card.linkedCardIds.includes(targetId)
    if (linked) {
      await unlinkCards(card.id, targetId)
    } else {
      await linkCards(card.id, targetId)
    }
    await onLinksChanged()
  }

  const brief = getCardBrief(card)

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-sumi/30 px-4">
      <div className="max-h-[80vh] w-full max-w-xl overflow-auto rounded-xl bg-white p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-medium">关联卡片：{brief.ja}</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-sm text-sumi-muted hover:text-sumi"
          >
            关闭
          </button>
        </div>
        <p className="mb-2 text-xs text-sumi-muted">
          仅显示同类型卡片：{CARD_TYPE_LABELS[card.type]}
        </p>
        <input
          value={linkQuery}
          onChange={(e) => setLinkQuery(e.target.value)}
          placeholder="搜索要关联的卡片"
          className="mb-3 w-full rounded-lg border border-card-border bg-white px-3 py-2"
        />
        <div className="space-y-2">
          {candidates.map((candidate) => {
            const linked = card.linkedCardIds.includes(candidate.id)
            const candidateBrief = getCardBrief(candidate)
            return (
              <div
                key={candidate.id}
                className="flex items-center justify-between rounded-lg border border-card-border px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm">{candidateBrief.ja}</p>
                  <p className="truncate text-xs text-sumi-muted">{candidateBrief.zh}</p>
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
  )
}
