import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { saveDeck } from '../lib/db'
import { generateId } from '../lib/id'
import { CARD_TYPE_LABELS, type CardType } from '../lib/types'

export function DeckNew() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [cardType, setCardType] = useState<CardType>('vocabulary')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    const now = new Date().toISOString()
    await saveDeck({
      id: generateId(),
      name: name.trim(),
      cardType,
      createdAt: now,
      updatedAt: now,
    })
    navigate('/decks')
  }

  return (
    <div>
      <h1 className="mb-4 text-xl font-medium">新建牌组</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1">
          <span className="text-sm text-sumi-muted">名称</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="rounded-lg border border-card-border bg-white px-3 py-2"
            required
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sm text-sumi-muted">卡片类型</span>
          <select
            value={cardType}
            onChange={(e) => setCardType(e.target.value as CardType)}
            className="rounded-lg border border-card-border bg-white px-3 py-2"
          >
            {(Object.keys(CARD_TYPE_LABELS) as CardType[]).map((t) => (
              <option key={t} value={t}>
                {CARD_TYPE_LABELS[t]}
              </option>
            ))}
          </select>
        </label>
        <button
          type="submit"
          className="rounded-xl bg-indigo-ja-dark py-3 text-white hover:bg-indigo-ja"
        >
          创建
        </button>
      </form>
    </div>
  )
}
