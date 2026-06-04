import type { CardType } from './types'

export const CARD_TYPE_ORDER_KEY = 'jl_card_type_order'

export const DEFAULT_CARD_TYPE_ORDER: CardType[] = [
  'vocabulary',
  'grammar',
  'corpus',
  'contrast',
]

const ALL_TYPES = new Set<CardType>(DEFAULT_CARD_TYPE_ORDER)

function isValidOrder(order: unknown): order is CardType[] {
  if (!Array.isArray(order) || order.length !== DEFAULT_CARD_TYPE_ORDER.length) {
    return false
  }
  const seen = new Set<string>()
  for (const item of order) {
    if (typeof item !== 'string' || !ALL_TYPES.has(item as CardType) || seen.has(item)) {
      return false
    }
    seen.add(item)
  }
  return true
}

export function getCardTypeOrder(): CardType[] {
  try {
    const raw = localStorage.getItem(CARD_TYPE_ORDER_KEY)
    if (!raw) return [...DEFAULT_CARD_TYPE_ORDER]
    const parsed: unknown = JSON.parse(raw)
    if (!isValidOrder(parsed)) return [...DEFAULT_CARD_TYPE_ORDER]
    return [...parsed]
  } catch {
    return [...DEFAULT_CARD_TYPE_ORDER]
  }
}

export function setCardTypeOrder(order: CardType[]): void {
  if (!isValidOrder(order)) return
  localStorage.setItem(CARD_TYPE_ORDER_KEY, JSON.stringify(order))
}

export function reorderCardTypeOrder(
  order: CardType[],
  dragged: CardType,
  target: CardType,
): CardType[] {
  if (dragged === target) return order
  const from = order.indexOf(dragged)
  const to = order.indexOf(target)
  if (from < 0 || to < 0) return order
  const next = [...order]
  next.splice(from, 1)
  next.splice(to, 0, dragged)
  setCardTypeOrder(next)
  return next
}
