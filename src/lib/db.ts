import Dexie, { type Table } from 'dexie'
import { migrateContrastCard } from './migrate-contrast-card'
import { migrateCorpusCard } from './migrate-corpus-card'
import { getCardSearchText, type Card, type CardType, type Deck } from './types'

export function deckMatchKey(deck: { name: string; cardType: CardType }): string {
  return `${deck.name.trim().toLowerCase()}::${deck.cardType}`
}

function pickCanonicalDeck(decks: Deck[]): Deck {
  return decks.reduce((best, deck) => {
    if (deck.createdAt < best.createdAt) return deck
    if (deck.createdAt > best.createdAt) return best
    return deck.id < best.id ? deck : best
  })
}

async function mergeDeckIdsIntoCanonical(
  sourceIds: string[],
  targetId: string,
  cardsTable: Table<Card, string>,
  decksTable: Table<Deck, string>,
): Promise<void> {
  const sources = sourceIds.filter((id) => id !== targetId)
  if (sources.length === 0) return

  const now = new Date().toISOString()
  for (const sourceId of sources) {
    const cards = await cardsTable.filter((card) => card.deckId === sourceId).toArray()
    for (const card of cards) {
      await cardsTable.put({ ...card, deckId: targetId, updatedAt: now })
    }
    await decksTable.delete(sourceId)
  }
}

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
    this.version(3).upgrade((tx) =>
      tx
        .table('cards')
        .toCollection()
        .modify((card: Card) => {
          const migrated = migrateContrastCard(card)
          if (migrated !== card) {
            Object.assign(card, migrated)
          }
        }),
    )
    this.version(4).upgrade((tx) =>
      tx
        .table('cards')
        .toCollection()
        .modify((card: Card) => {
          const migrated = migrateContrastCard(card)
          if (migrated !== card) {
            Object.assign(card, migrated)
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

/** 保存牌组；若存在同名同类型牌组则自动合并并返回保留的牌组 id */
export async function saveDeck(deck: Deck): Promise<string> {
  const normalized: Deck = {
    ...deck,
    name: deck.name.trim(),
    updatedAt: deck.updatedAt || new Date().toISOString(),
  }

  const allDecks = await db.decks.toArray()
  const duplicates = allDecks.filter(
    (d) => d.id !== normalized.id && deckMatchKey(d) === deckMatchKey(normalized),
  )

  if (duplicates.length === 0) {
    await db.decks.put(normalized)
    return normalized.id
  }

  const canonical = pickCanonicalDeck([normalized, ...duplicates])
  const sourcesToMerge = [normalized.id, ...duplicates.map((d) => d.id)].filter(
    (id) => id !== canonical.id,
  )

  await db.transaction('rw', db.decks, db.cards, async (tx) => {
    const decksTable = tx.table<Deck, string>('decks')
    const cardsTable = tx.table<Card, string>('cards')
    await decksTable.put({
      ...canonical,
      name: normalized.name,
      updatedAt: normalized.updatedAt,
    })
    await mergeDeckIdsIntoCanonical(sourcesToMerge, canonical.id, cardsTable, decksTable)
  })

  return canonical.id
}

/** 合并数据库中所有同名同类型牌组，返回被合并掉的牌组数量 */
export async function mergeDuplicateDecks(): Promise<number> {
  const allDecks = await db.decks.toArray()
  const groups = new Map<string, Deck[]>()
  for (const deck of allDecks) {
    const key = deckMatchKey(deck)
    const list = groups.get(key) ?? []
    list.push(deck)
    groups.set(key, list)
  }

  let mergedCount = 0
  await db.transaction('rw', db.decks, db.cards, async (tx) => {
    const decksTable = tx.table<Deck, string>('decks')
    const cardsTable = tx.table<Card, string>('cards')

    for (const decks of groups.values()) {
      if (decks.length <= 1) continue
      const canonical = pickCanonicalDeck(decks)
      const sources = decks.filter((d) => d.id !== canonical.id).map((d) => d.id)
      await mergeDeckIdsIntoCanonical(sources, canonical.id, cardsTable, decksTable)
      mergedCount += sources.length
    }
  })

  return mergedCount
}

async function removeLinkedCardReferences(
  cardsTable: Table<Card, string>,
  deletedIds: Set<string>,
): Promise<void> {
  if (deletedIds.size === 0) return
  const allCards = await cardsTable.toArray()
  const now = new Date().toISOString()
  for (const card of allCards) {
    if (deletedIds.has(card.id)) continue
    const nextLinks = (card.linkedCardIds ?? []).filter((lid) => !deletedIds.has(lid))
    if (nextLinks.length !== (card.linkedCardIds ?? []).length) {
      await cardsTable.put({ ...card, linkedCardIds: nextLinks, updatedAt: now })
    }
  }
}

export async function cleanupOrphanedCards(): Promise<number> {
  const deckIds = new Set((await db.decks.toArray()).map((deck) => deck.id))
  const orphans = await db.cards.filter((card) => !deckIds.has(card.deckId)).toArray()
  if (orphans.length === 0) return 0

  const cardIds = orphans.map((card) => card.id)
  await db.transaction('rw', db.cards, async (tx) => {
    const cardsTable = tx.table<Card, string>('cards')
    await removeLinkedCardReferences(cardsTable, new Set(cardIds))
    await cardsTable.bulkDelete(cardIds)
  })
  return orphans.length
}

export async function deleteDeck(id: string): Promise<void> {
  await db.transaction('rw', db.decks, db.cards, async (tx) => {
    const cardsTable = tx.table<Card, string>('cards')
    const cardsInDeck = await cardsTable.filter((card) => card.deckId === id).toArray()
    const cardIds = cardsInDeck.map((card) => card.id)
    const deletedIds = new Set(cardIds)

    if (deletedIds.size > 0) {
      await removeLinkedCardReferences(cardsTable, deletedIds)
      await cardsTable.bulkDelete(cardIds)
    }

    await tx.table<Deck, string>('decks').delete(id)
  })
  await cleanupOrphanedCards()
}

export async function getCardsByDeck(deckId: string): Promise<Card[]> {
  const cards = await db.cards.where('deckId').equals(deckId).toArray()
  return cards.map(normalizeCard)
}

export async function getAllCards(): Promise<Card[]> {
  const cards = await db.cards.toArray()
  return cards.map(normalizeCard)
}

export async function searchCards(query: string, deckId?: string): Promise<Card[]> {
  const keyword = query.trim().toLowerCase()
  const cards = deckId ? await getCardsByDeck(deckId) : await getAllCards()
  if (!keyword) return cards
  return cards.filter((card) => getCardSearchText(card).includes(keyword))
}

function normalizeCard(card: Card): Card {
  return migrateCorpusCard(migrateContrastCard(card))
}

export async function getCard(id: string): Promise<Card | undefined> {
  const card = await db.cards.get(id)
  if (!card) return undefined
  const normalized = normalizeCard(card)
  if (normalized !== card) {
    await db.cards.put(normalized)
  }
  return normalized
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
  await db.transaction('rw', db.cards, async (tx) => {
    const cardsTable = tx.table<Card, string>('cards')
    const deletedIds = new Set([id])
    await removeLinkedCardReferences(cardsTable, deletedIds)
    await cardsTable.delete(id)
  })
}

export async function mergeImportedData(
  importedDecks: Deck[],
  importedCards: Card[],
): Promise<{
  addedDeckCount: number
  addedCardCount: number
  skippedDeckCount: number
  skippedCardCount: number
}> {
  await mergeDuplicateDecks()

  const existingDecks = await db.decks.toArray()
  const existingDeckIds = new Set(existingDecks.map((d) => d.id))
  const existingCardIds = new Set((await db.cards.toArray()).map((c) => c.id))
  const deckIdByKey = new Map(existingDecks.map((d) => [deckMatchKey(d), d.id]))

  const deckIdRemap = new Map<string, string>()
  const decksToAdd: Deck[] = []
  let skippedDeckCount = 0

  for (const deck of importedDecks) {
    if (existingDeckIds.has(deck.id)) {
      skippedDeckCount++
      continue
    }
    const key = deckMatchKey(deck)
    const existingId = deckIdByKey.get(key)
    if (existingId) {
      deckIdRemap.set(deck.id, existingId)
      skippedDeckCount++
      continue
    }
    decksToAdd.push(deck)
    deckIdByKey.set(key, deck.id)
    existingDeckIds.add(deck.id)
  }

  const validDeckIds = new Set([...existingDeckIds, ...decksToAdd.map((d) => d.id)])

  const cardsToAdd = importedCards
    .filter((c) => !existingCardIds.has(c.id))
    .map((c) => ({
      ...c,
      deckId: deckIdRemap.get(c.deckId) ?? c.deckId,
    }))
    .filter((c) => validDeckIds.has(c.deckId))

  await db.transaction('rw', db.decks, db.cards, async () => {
    if (decksToAdd.length) await db.decks.bulkPut(decksToAdd)
    if (cardsToAdd.length) await db.cards.bulkPut(cardsToAdd)
  })

  await mergeDuplicateDecks()

  return {
    addedDeckCount: decksToAdd.length,
    addedCardCount: cardsToAdd.length,
    skippedDeckCount,
    skippedCardCount: importedCards.length - cardsToAdd.length,
  }
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
  const byType: Record<string, number> = {
    vocabulary: 0,
    grammar: 0,
    corpus: 0,
    contrast: 0,
  }
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
