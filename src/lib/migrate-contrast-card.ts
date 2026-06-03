import type { Card, ContrastCard, ContrastEntry, ExamplePair } from './types'

interface LegacyContrastFront {
  title: string
  prompt?: string
  items?: { label: string; subtitle?: string }[]
}

interface LegacyContrastBack {
  summary?: string
  points?: { aspect: string; detail: string }[]
  examples?: ExamplePair[]
  pitfalls?: string[]
  items?: ContrastEntry[]
  item1?: ContrastEntry
  item2?: ContrastEntry
}

function entryFromLegacy(
  label: string,
  subtitle: string | undefined,
  examples: ExamplePair[],
): ContrastEntry {
  return {
    label,
    subtitle,
    examples,
  }
}

function buildItemsFromLegacy(
  front: LegacyContrastFront,
  back: LegacyContrastBack,
): ContrastEntry[] {
  const legacyItems = front.items ?? []
  const sharedExamples = back.examples ?? []

  return [
    entryFromLegacy(
      legacyItems[0]?.label ?? '',
      legacyItems[0]?.subtitle,
      sharedExamples[0] ? [sharedExamples[0]] : [],
    ),
    entryFromLegacy(
      legacyItems[1]?.label ?? '',
      legacyItems[1]?.subtitle,
      sharedExamples[1] ? [sharedExamples[1]] : sharedExamples.slice(1),
    ),
  ]
}

/** 将旧版辨析卡结构迁移为 items[] 格式 */
export function migrateContrastCard(card: Card): Card {
  if (card.type !== 'contrast') return card

  const c = card as ContrastCard
  const back = c.back as LegacyContrastBack

  if (Array.isArray(back.items) && back.items.length >= 2) {
    return c
  }

  const front = c.front as LegacyContrastFront & ContrastCard['front']
  let items: ContrastEntry[]

  if (back.item1 && back.item2) {
    items = [back.item1, back.item2]
  } else {
    items = buildItemsFromLegacy(front, back)
  }

  const pitfalls = [...(back.pitfalls ?? [])]
  if (back.summary?.trim()) pitfalls.unshift(back.summary.trim())
  for (const pt of back.points ?? []) {
    const line = `${pt.aspect}：${pt.detail}`.trim()
    if (line) pitfalls.push(line)
  }

  const migrated: ContrastCard = {
    ...c,
    front: {
      title: front.title,
      prompt: front.prompt,
    },
    back: {
      items,
      pitfalls: pitfalls.length > 0 ? pitfalls : undefined,
    },
  }
  return migrated
}
