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
  description?: string
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
  vocabulary: '词语',
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
