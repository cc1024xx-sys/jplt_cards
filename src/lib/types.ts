export type CardType = 'vocabulary' | 'grammar' | 'corpus'
export type Familiarity = 'new' | 'mastered' | 'familiar' | 'unfamiliar'

export interface CardReviewState {
  familiarity: Familiarity
  lastReviewedAt: string | null
  nextReviewAt: string | null
  reviewCount: number
}

export interface Deck {
  id: string
  name: string
  cardType: CardType
  createdAt: string
  updatedAt: string
}

export interface ExamplePair {
  ja: string
  zh: string
}

export interface VocabularyFront {
  meaningZh: string
  hint?: string
}

export interface VocabularyBack {
  expressionJa: string
  reading?: string
  scenarios: string[]
  examples?: ExamplePair[]
}

export interface GrammarFront {
  pattern: string
}

export interface GrammarBack {
  meaningZh: string
  scenarios: string[]
  examples: ExamplePair[]
}

export interface CorpusWord {
  ja: string
  zh: string
  reading?: string
}

export interface CorpusPhrase {
  ja: string
  zh: string
  note?: string
}

export interface CorpusFront {
  scenario: string
}

export interface CorpusBack {
  words: CorpusWord[]
  phrases: CorpusPhrase[]
}

export interface BaseCard {
  id: string
  deckId: string
  type: CardType
  tags: string[]
  linkedCardIds: string[]
  createdAt: string
  updatedAt: string
  review: CardReviewState
}

export interface VocabularyCard extends BaseCard {
  type: 'vocabulary'
  front: VocabularyFront
  back: VocabularyBack
}

export interface GrammarCard extends BaseCard {
  type: 'grammar'
  front: GrammarFront
  back: GrammarBack
}

export interface CorpusCard extends BaseCard {
  type: 'corpus'
  front: CorpusFront
  back: CorpusBack
}

export type Card = VocabularyCard | GrammarCard | CorpusCard

export interface BackupFile {
  version: number
  exportedAt: string
  decks: Deck[]
  cards: Card[]
}

export const CARD_TYPE_LABELS: Record<CardType, string> = {
  vocabulary: '词汇',
  grammar: '语法',
  corpus: '语料库',
}

export const FAMILIARITY_LABELS: Record<Familiarity, string> = {
  new: '未学习',
  mastered: '掌握',
  familiar: '熟悉',
  unfamiliar: '不熟',
}

export function createDefaultReview(): CardReviewState {
  return {
    familiarity: 'new',
    lastReviewedAt: null,
    nextReviewAt: null,
    reviewCount: 0,
  }
}

export function isVocabularyCard(card: Card): card is VocabularyCard {
  return card.type === 'vocabulary'
}

export function isGrammarCard(card: Card): card is GrammarCard {
  return card.type === 'grammar'
}

export function isCorpusCard(card: Card): card is CorpusCard {
  return card.type === 'corpus'
}

export function getCardFrontText(card: Card): string {
  if (card.type === 'vocabulary') return card.front.meaningZh
  if (card.type === 'grammar') return card.front.pattern
  return card.front.scenario
}

/** 复习/列表用：日语表达 + 中文意思 */
export function getCardBrief(card: Card): { ja: string; zh: string } {
  if (card.type === 'vocabulary') {
    return { ja: card.back.expressionJa, zh: card.front.meaningZh }
  }
  if (card.type === 'grammar') {
    return { ja: card.front.pattern, zh: card.back.meaningZh }
  }
  const phrase = card.back.phrases[0]
  if (phrase) return { ja: phrase.ja, zh: phrase.zh }
  const word = card.back.words[0]
  if (word) return { ja: word.ja, zh: word.zh }
  return { ja: card.front.scenario, zh: card.front.scenario }
}

export function getCardSearchText(card: Card): string {
  const parts: string[] = [getCardFrontText(card), ...card.tags]
  if (card.type === 'vocabulary') {
    parts.push(card.back.expressionJa, card.back.reading ?? '')
    parts.push(...card.back.scenarios)
    for (const ex of card.back.examples ?? []) {
      parts.push(ex.ja, ex.zh)
    }
  } else if (card.type === 'grammar') {
    parts.push(card.back.meaningZh, ...card.back.scenarios)
    for (const ex of card.back.examples) {
      parts.push(ex.ja, ex.zh)
    }
  } else {
    for (const w of card.back.words) {
      parts.push(w.ja, w.zh, w.reading ?? '')
    }
    for (const p of card.back.phrases) {
      parts.push(p.ja, p.zh, p.note ?? '')
    }
  }
  return parts.join(' ').toLowerCase()
}
