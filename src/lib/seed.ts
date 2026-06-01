import { getAllDecks, saveCard, saveDeck } from './db'
import { generateId } from './id'
import { createDefaultReview } from './types'

export async function seedSampleData(): Promise<void> {
  const existing = await getAllDecks()
  if (existing.length > 0) return

  const now = new Date().toISOString()
  const vocabDeckId = generateId()
  const grammarDeckId = generateId()
  const corpusDeckId = generateId()

  await saveDeck({
    id: vocabDeckId,
    name: '日常词语',
    cardType: 'vocabulary',
    createdAt: now,
    updatedAt: now,
  })
  await saveDeck({
    id: grammarDeckId,
    name: '基础语法',
    cardType: 'grammar',
    createdAt: now,
    updatedAt: now,
  })
  await saveDeck({
    id: corpusDeckId,
    name: '便利店口语',
    cardType: 'corpus',
    createdAt: now,
    updatedAt: now,
  })

  await saveCard({
    id: generateId(),
    deckId: vocabDeckId,
    type: 'vocabulary',
    tags: ['示例'],
    createdAt: now,
    updatedAt: now,
    review: createDefaultReview(),
    linkedCardIds: [],
    front: { meaningZh: '结账；买单', hint: '餐厅' },
    back: {
      expressionJa: 'お会計お願いします',
      reading: 'おかいけいおねがいします',
      scenarios: ['餐厅结账', '便利店付款前询问'],
      examples: [{ ja: 'すみません、お会計お願いします。', zh: '不好意思，请结账。' }],
    },
  })

  await saveCard({
    id: generateId(),
    deckId: grammarDeckId,
    type: 'grammar',
    tags: ['示例'],
    createdAt: now,
    updatedAt: now,
    review: createDefaultReview(),
    linkedCardIds: [],
    front: { pattern: '动词て形 + から' },
    back: {
      meaningZh: '表示先后顺序：做完 A 之后做 B',
      scenarios: ['叙述日常安排', '说明步骤'],
      examples: [
        { ja: 'ご飯を食べてから、勉強します。', zh: '吃完饭之后再学习。' },
        { ja: '仕事が終わってから、飲みに行きましょう。', zh: '下班之后去喝一杯吧。' },
      ],
    },
  })

  await saveCard({
    id: generateId(),
    deckId: corpusDeckId,
    type: 'corpus',
    tags: ['示例'],
    createdAt: now,
    updatedAt: now,
    review: createDefaultReview(),
    linkedCardIds: [],
    front: { scenario: '在便利店买饮料' },
    back: {
      words: [
        { ja: 'コーヒー', zh: '咖啡', reading: 'こーひー' },
        { ja: 'お茶', zh: '茶', reading: 'おちゃ' },
        { ja: '袋', zh: '袋子', reading: 'ふくろ' },
      ],
      phrases: [
        { ja: 'これください', zh: '请给我这个' },
        { ja: '袋いりますか', zh: '需要袋子吗', note: '店员常用问句' },
        { ja: '大丈夫です', zh: '不用了/没关系' },
      ],
    },
  })
}
