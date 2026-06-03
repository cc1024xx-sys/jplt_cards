import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { deleteDeck, getAllDecks, saveDeck } from '../lib/db'
import { CARD_TYPE_LABELS, type CardType, type Deck } from '../lib/types'

export function DeckEdit() {
  const [decks, setDecks] = useState<Deck[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draft, setDraft] = useState({
    name: '',
    cardType: 'vocabulary' as CardType,
    createdAt: '',
  })

  const loadDecks = async () => {
    const list = await getAllDecks()
    setDecks(list)
    setLoading(false)
  }

  useEffect(() => {
    void loadDecks()
  }, [])

  const startEdit = (deck: Deck) => {
    setEditingId(deck.id)
    setDraft({
      name: deck.name,
      cardType: deck.cardType,
      createdAt: deck.createdAt,
    })
  }

  const handleSave = async (deckId: string) => {
    if (!draft.name.trim()) return
    await saveDeck({
      id: deckId,
      name: draft.name.trim(),
      cardType: draft.cardType,
      createdAt: draft.createdAt,
      updatedAt: new Date().toISOString(),
    })
    setEditingId(null)
    await loadDecks()
  }

  const handleDelete = async (deckId: string) => {
    if (!confirm('确定删除该牌组及其所有闪卡？')) return
    await deleteDeck(deckId)
    if (editingId === deckId) setEditingId(null)
    await loadDecks()
  }

  const decksByType = {
    vocabulary: decks.filter((d) => d.cardType === 'vocabulary'),
    grammar: decks.filter((d) => d.cardType === 'grammar'),
    corpus: decks.filter((d) => d.cardType === 'corpus'),
    contrast: decks.filter((d) => d.cardType === 'contrast'),
  }
  const groupOrder: CardType[] = ['vocabulary', 'grammar', 'corpus', 'contrast']

  if (loading) return <p className="text-center text-sumi-muted">加载中…</p>

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-medium">编辑牌组</h1>
        <Link
          to="/decks"
          className="rounded border border-card-border px-3 py-1.5 text-sm text-sumi-muted no-underline hover:bg-washi"
        >
          返回牌组页
        </Link>
      </div>

      {decks.length === 0 ? (
        <p className="text-sm text-sumi-muted">当前没有可编辑牌组。</p>
      ) : (
        <div className="flex flex-col gap-3">
          {groupOrder.map((type) => (
            <section key={type} className="rounded-xl border border-card-border bg-white p-3">
              <p className="mb-2 font-medium text-sumi">{CARD_TYPE_LABELS[type]}</p>
              <div className="space-y-2">
                {decksByType[type].map((deck) => (
                  <div key={deck.id} className="rounded-lg border border-card-border bg-washi/40 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="min-w-0 truncate text-sm font-medium text-sumi">{deck.name}</p>
                      <div className="flex shrink-0 items-center gap-2">
                        <Link
                          to={`/cards/new?deckId=${deck.id}`}
                          className="rounded border border-sakura/40 bg-sakura/10 px-2 py-1 text-xs text-sakura-deep no-underline hover:bg-sakura/20"
                        >
                          新建闪卡
                        </Link>
                        <button
                          type="button"
                          onClick={() => startEdit(deck)}
                          className="rounded border border-card-border px-2 py-1 text-xs text-indigo-ja-dark hover:bg-white"
                        >
                          修改
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleDelete(deck.id)}
                          className="rounded border border-unfamiliar/40 px-2 py-1 text-xs text-sakura-deep hover:bg-unfamiliar/10"
                        >
                          删除
                        </button>
                      </div>
                    </div>

                    {editingId === deck.id && (
                      <div className="mt-3 space-y-2 border-t border-card-border pt-3">
                        <input
                          value={draft.name}
                          onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
                          placeholder="牌组名称"
                          className="w-full rounded-lg border border-card-border bg-white px-3 py-2 text-sm"
                        />
                        <select
                          value={draft.cardType}
                          onChange={(e) =>
                            setDraft((d) => ({ ...d, cardType: e.target.value as CardType }))
                          }
                          className="w-full rounded-lg border border-card-border bg-white px-3 py-2 text-sm"
                        >
                          {(Object.keys(CARD_TYPE_LABELS) as CardType[]).map((t) => (
                            <option key={t} value={t}>
                              {CARD_TYPE_LABELS[t]}
                            </option>
                          ))}
                        </select>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => void handleSave(deck.id)}
                            className="rounded-lg bg-indigo-ja-dark px-3 py-1.5 text-xs text-white"
                          >
                            保存
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingId(null)}
                            className="rounded-lg border border-card-border px-3 py-1.5 text-xs text-sumi-muted"
                          >
                            取消
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                {decksByType[type].length === 0 && (
                  <p className="text-xs text-sumi-muted">该类型暂无牌组</p>
                )}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}
