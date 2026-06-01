import Dexie, { type Table } from 'dexie'
import { getCardSearchText, type Card, type Deck } from './types'

export class JapaneseLearningDB extends Dexie {
  decks!: Table<Deck, string>
  cards!: Table<Card, string>

  constructor() {
    super('JapaneseLearningDB')
    this.version(1).stores({
      decks: 'id, cardType, updatedAt',
      cards: 'id, deckId, type, *tags, updatedAt, review.familiarity, review.nextReviewAt',
    })
    this.version(2)
      .stores({
        decks: 'id, cardType, updatedAt',
        cards:
          'id, deckId, type, *tags, *linkedCardIds, updatedAt, review.familiarity, review.nextReviewAt',
      })
      .upgrade((tx) =>
        tx
          .table('cards')
          .toCollection()
          .modify((card: Card & { linkedCardIds?: string[] }) => {
            if (!Array.isArray(card.linkedCardIds)) {
              card.linkedCardIds = []
            }
          }),
      )
  }
}

export const db = new JapaneseLearningDB()

export async function getAllDecks(): Promise<Deck[]> {
  return db.decks.orderBy('updatedAt').reverse().toArray()
}

export async function getDeck(id: string): Promise<Deck | undefined> {
  return db.decks.get(id)
}

export async function saveDeck(deck: Deck): Promise<void> {
  await db.decks.put(deck)
}

export async function deleteDeck(id: string): Promise<void> {
  await db.transaction('rw', db.decks, db.cards, async () => {
    await db.cards.where('deckId').equals(id).delete()
    await db.decks.delete(id)
  })
}

export async function getCardsByDeck(deckId: string): Promise<Card[]> {
  return db.cards.where('deckId').equals(deckId).toArray()
}

export async function getAllCards(): Promise<Card[]> {
  return db.cards.toArray()
}

export async function searchCards(query: string, deckId?: string): Promise<Card[]> {
  const keyword = query.trim().toLowerCase()
  const cards = deckId ? await getCardsByDeck(deckId) : await getAllCards()
  if (!keyword) return cards
  return cards.filter((card) => getCardSearchText(card).includes(keyword))
}

export async function getCard(id: string): Promise<Card | undefined> {
  return db.cards.get(id)
}

export async function saveCard(card: Card): Promise<void> {
  await db.cards.put(card)
}

export async function linkCards(cardId: string, targetCardId: string): Promise<void> {
  if (!cardId || !targetCardId || cardId === targetCardId) return
  await db.transaction('rw', db.cards, async () => {
    const a = await db.cards.get(cardId)
    const b = await db.cards.get(targetCardId)
    if (!a || !b) return

    const aLinks = new Set(a.linkedCardIds ?? [])
    const bLinks = new Set(b.linkedCardIds ?? [])
    aLinks.add(targetCardId)
    bLinks.add(cardId)

    await db.cards.put({ ...a, linkedCardIds: [...aLinks], updatedAt: new Date().toISOString() })
    await db.cards.put({ ...b, linkedCardIds: [...bLinks], updatedAt: new Date().toISOString() })
  })
}

export async function unlinkCards(cardId: string, targetCardId: string): Promise<void> {
  if (!cardId || !targetCardId || cardId === targetCardId) return
  await db.transaction('rw', db.cards, async () => {
    const a = await db.cards.get(cardId)
    const b = await db.cards.get(targetCardId)
    if (!a || !b) return

    await db.cards.put({
      ...a,
      linkedCardIds: (a.linkedCardIds ?? []).filter((id) => id !== targetCardId),
      updatedAt: new Date().toISOString(),
    })
    await db.cards.put({
      ...b,
      linkedCardIds: (b.linkedCardIds ?? []).filter((id) => id !== cardId),
      updatedAt: new Date().toISOString(),
    })
  })
}

export async function deleteCard(id: string): Promise<void> {
  await db.cards.delete(id)
}

export async function replaceAllData(decks: Deck[], cards: Card[]): Promise<void> {
  await db.transaction('rw', db.decks, db.cards, async () => {
    await db.decks.clear()
    await db.cards.clear()
    await db.decks.bulkPut(decks)
    await db.cards.bulkPut(cards)
  })
}

export async function getStats(): Promise<{
  totalCards: number
  dueCount: number
  byType: Record<string, number>
  byFamiliarity: Record<string, number>
}> {
  const cards = await getAllCards()
  const todayEnd = new Date()
  todayEnd.setHours(23, 59, 59, 999)

  let dueCount = 0
  const byType: Record<string, number> = { vocabulary: 0, grammar: 0, corpus: 0 }
  const byFamiliarity: Record<string, number> = {
    new: 0,
    mastered: 0,
    familiar: 0,
    unfamiliar: 0,
  }

  for (const card of cards) {
    byType[card.type] = (byType[card.type] ?? 0) + 1
    byFamiliarity[card.review.familiarity] =
      (byFamiliarity[card.review.familiarity] ?? 0) + 1
    if (
      card.review.familiarity === 'new' ||
      !card.review.nextReviewAt ||
      new Date(card.review.nextReviewAt) <= todayEnd
    ) {
      dueCount++
    }
  }

  return { totalCards: cards.length, dueCount, byType, byFamiliarity }
}
