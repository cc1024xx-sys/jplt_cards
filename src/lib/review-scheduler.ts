import type { CardReviewState, Familiarity } from './types'

const DAY_MS = 24 * 60 * 60 * 1000

const INTERVALS: Record<Familiarity, number[]> = {
  new: [0],
  unfamiliar: [0, 1, 2],
  familiar: [1, 3, 7],
  mastered: [7, 14, 30],
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  next.setHours(0, 0, 0, 0)
  return next
}

export function startOfToday(): Date {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d
}

export function isDue(review: CardReviewState, now = new Date()): boolean {
  if (review.familiarity === 'new') return true
  if (!review.nextReviewAt) return true
  return new Date(review.nextReviewAt) <= now
}

export function applyFamiliarity(
  review: CardReviewState,
  familiarity: Familiarity,
  now = new Date(),
): CardReviewState {
  const intervals = INTERVALS[familiarity]
  const index = Math.min(review.reviewCount, intervals.length - 1)
  const days = intervals[index]
  const nextReviewAt = addDays(now, days).toISOString()

  return {
    familiarity,
    lastReviewedAt: now.toISOString(),
    nextReviewAt,
    reviewCount: review.reviewCount + 1,
  }
}

export function reviewPriority(review: CardReviewState): number {
  switch (review.familiarity) {
    case 'unfamiliar':
      return 0
    case 'new':
      return 1
    case 'familiar':
      return 2
    case 'mastered':
      return 3
    default:
      return 4
  }
}

export function sortForReview<T extends { review: CardReviewState }>(items: T[]): T[] {
  const today = startOfToday().getTime()
  return [...items]
    .filter((item) => {
      if (item.review.familiarity === 'new') return true
      if (!item.review.nextReviewAt) return true
      return new Date(item.review.nextReviewAt).getTime() <= today + DAY_MS - 1
    })
    .sort((a, b) => {
      const pa = reviewPriority(a.review)
      const pb = reviewPriority(b.review)
      if (pa !== pb) return pa - pb
      const na = a.review.nextReviewAt ? new Date(a.review.nextReviewAt).getTime() : 0
      const nb = b.review.nextReviewAt ? new Date(b.review.nextReviewAt).getTime() : 0
      return na - nb
    })
}
