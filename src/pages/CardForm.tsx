import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { CorpusPhraseFields, CorpusWordFields } from '../components/CorpusFields'
import { ExampleFields } from '../components/ExampleFields'
import { LinkCardsModal } from '../components/LinkCardsModal'
import { LinkedCardsSection } from '../components/LinkedCardsSection'
import { getAllCards, getAllDecks, getCard, saveCard } from '../lib/db'
import { normalizeExampleList } from '../lib/example-text'
import { generateId } from '../lib/id'
import {
  CARD_TYPE_LABELS,
  createDefaultReview,
  type Card,
  type CardType,
  type CorpusCard,
  type CorpusPhrase,
  type CorpusWord,
  type Deck,
  type ExamplePair,
  type GrammarCard,
  type VocabularyCard,
} from '../lib/types'

export function CardForm() {
  const { cardId } = useParams<{ cardId: string }>()
  const [searchParams] = useSearchParams()
  const presetDeckId = searchParams.get('deckId')
  const navigate = useNavigate()
  const isEdit = Boolean(cardId)

  const [decks, setDecks] = useState<Deck[]>([])
  const [deckId, setDeckId] = useState(presetDeckId ?? '')
  const [cardType, setCardType] = useState<CardType>('vocabulary')
  const [loading, setLoading] = useState(isEdit)

  // Vocabulary
  const [meaningZh, setMeaningZh] = useState('')
  const [hint, setHint] = useState('')
  const [expressionJa, setExpressionJa] = useState('')
  const [reading, setReading] = useState('')
  const [vocabScenarios, setVocabScenarios] = useState('')
  const [vocabExamples, setVocabExamples] = useState<ExamplePair[]>([{ ja: '', zh: '' }])

  // Grammar
  const [pattern, setPattern] = useState('')
  const [grammarMeaning, setGrammarMeaning] = useState('')
  const [grammarScenarios, setGrammarScenarios] = useState('')
  const [grammarExamples, setGrammarExamples] = useState<ExamplePair[]>([{ ja: '', zh: '' }])

  // Corpus
  const [scenario, setScenario] = useState('')
  const [corpusWords, setCorpusWords] = useState<CorpusWord[]>([])
  const [corpusPhrases, setCorpusPhrases] = useState<CorpusPhrase[]>([])

  const [tags, setTags] = useState('')
  const [editingCard, setEditingCard] = useState<Card | null>(null)
  const [linkedCardIds, setLinkedCardIds] = useState<string[]>([])
  const [allCards, setAllCards] = useState<Card[]>([])
  const [showLinkModal, setShowLinkModal] = useState(false)

  const normalizeDecks = (list: Deck[]): Deck[] => {
    // 按 id 与「名称+类型」双重去重，避免选择器中出现重复牌组项。
    const byId = new Map<string, Deck>()
    for (const deck of list) {
      const existing = byId.get(deck.id)
      if (!existing || deck.updatedAt > existing.updatedAt) {
        byId.set(deck.id, deck)
      }
    }

    const byNameType = new Map<string, Deck>()
    for (const deck of byId.values()) {
      const key = `${deck.name.trim().toLowerCase()}::${deck.cardType}`
      const existing = byNameType.get(key)
      if (!existing || deck.updatedAt > existing.updatedAt) {
        byNameType.set(key, deck)
      }
    }
    return [...byNameType.values()]
  }

  const loadDecks = useCallback(async () => {
    const list = normalizeDecks(await getAllDecks())
    setDecks(list)
    setDeckId((prev) => {
      if (prev && list.some((d) => d.id === prev)) return prev
      return list[0]?.id ?? ''
    })
  }, [])

  useEffect(() => {
    void loadDecks()
  }, [loadDecks])

  useEffect(() => {
    if (!cardId) return
    getCard(cardId).then((card) => {
      if (!card) {
        navigate('/decks')
        return
      }
      setDeckId(card.deckId)
      setCardType(card.type)
      setTags(card.tags.join(', '))
      if (card.type === 'vocabulary') {
        setMeaningZh(card.front.meaningZh)
        setHint(card.front.hint ?? '')
        setExpressionJa(card.back.expressionJa)
        setReading(card.back.reading ?? '')
        setVocabScenarios(card.back.scenarios.join('\n'))
        setVocabExamples(
          card.back.examples?.length ? card.back.examples : [{ ja: '', zh: '' }],
        )
      } else if (card.type === 'grammar') {
        setPattern(card.front.pattern)
        setGrammarMeaning(card.back.meaningZh)
        setGrammarScenarios(card.back.scenarios.join('\n'))
        setGrammarExamples(
          card.back.examples.length > 0 ? card.back.examples : [{ ja: '', zh: '' }],
        )
      } else {
        setScenario(card.front.scenario)
        setCorpusWords(card.back.words)
        setCorpusPhrases(card.back.phrases)
      }
      setEditingCard(card)
      setLinkedCardIds(card.linkedCardIds ?? [])
      void getAllCards().then(setAllCards)
      setLoading(false)
    })
  }, [cardId, navigate])

  const refreshLinks = useCallback(async () => {
    if (!cardId) return
    const card = await getCard(cardId)
    if (card) {
      setEditingCard(card)
      setLinkedCardIds(card.linkedCardIds ?? [])
      setAllCards(await getAllCards())
    }
  }, [cardId])

  const linkingCardSnapshot = useMemo((): Card | null => {
    if (!editingCard) return null
    return { ...editingCard, linkedCardIds }
  }, [editingCard, linkedCardIds])

  const linkedCardsPreview = useMemo(
    () =>
      linkedCardIds
        .map((id) => allCards.find((c) => c.id === id))
        .filter((c): c is Card => Boolean(c)),
    [linkedCardIds, allCards],
  )

  useEffect(() => {
    if (isEdit || !deckId) return
    const deck = decks.find((d) => d.id === deckId)
    if (deck) setCardType(deck.cardType)
  }, [deckId, decks, isEdit])

  const parseLines = (text: string) =>
    text
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean)

  const normalizeCorpusWords = (words: CorpusWord[]): CorpusWord[] =>
    words
      .map((w) => ({
        ja: w.ja.trim(),
        zh: w.zh.trim(),
        reading: w.reading?.trim() || undefined,
      }))
      .filter((w) => w.ja && w.zh)

  const normalizeCorpusPhrases = (phrases: CorpusPhrase[]): CorpusPhrase[] =>
    phrases
      .map((p) => ({
        ja: p.ja.trim(),
        zh: p.zh.trim(),
        note: p.note?.trim() || undefined,
      }))
      .filter((p) => p.ja && p.zh)

  const resetStructuredFields = () => {
    setVocabExamples([{ ja: '', zh: '' }])
    setGrammarExamples([{ ja: '', zh: '' }])
    setCorpusWords([])
    setCorpusPhrases([])
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!deckId) {
      alert('请先创建并选择牌组')
      return
    }

    const now = new Date().toISOString()
    const tagList = tags
      .split(/[,，]/)
      .map((t) => t.trim())
      .filter(Boolean)

    let card: Card
    const id = cardId ?? generateId()
    const existing = cardId ? await getCard(cardId) : null
    const review = existing?.review ?? createDefaultReview()
    const createdAt = existing?.createdAt ?? now
    const savedLinkedIds = isEdit ? linkedCardIds : (existing?.linkedCardIds ?? [])

    const vocabExampleList = normalizeExampleList(vocabExamples)
    const grammarExampleList = normalizeExampleList(grammarExamples)

    if (cardType === 'vocabulary') {
      card = {
        id,
        deckId,
        type: 'vocabulary',
        tags: tagList,
        createdAt,
        updatedAt: now,
        review,
        linkedCardIds: savedLinkedIds,
        front: { meaningZh: meaningZh.trim(), hint: hint.trim() || undefined },
        back: {
          expressionJa: expressionJa.trim(),
          reading: reading.trim() || undefined,
          scenarios: parseLines(vocabScenarios),
          examples: vocabExampleList.length > 0 ? vocabExampleList : undefined,
        },
      } satisfies VocabularyCard
    } else if (cardType === 'grammar') {
      card = {
        id,
        deckId,
        type: 'grammar',
        tags: tagList,
        createdAt,
        updatedAt: now,
        review,
        linkedCardIds: savedLinkedIds,
        front: { pattern: pattern.trim() },
        back: {
          meaningZh: grammarMeaning.trim(),
          scenarios: parseLines(grammarScenarios),
          examples: grammarExampleList,
        },
      } satisfies GrammarCard
    } else {
      const words = normalizeCorpusWords(corpusWords)
      const phrases = normalizeCorpusPhrases(corpusPhrases)

      card = {
        id,
        deckId,
        type: 'corpus',
        tags: tagList,
        createdAt,
        updatedAt: now,
        review,
        linkedCardIds: savedLinkedIds,
        front: { scenario: scenario.trim() },
        back: { words, phrases },
      } satisfies CorpusCard
    }

    await saveCard(card)
    navigate(deckId ? `/decks/${deckId}` : '/decks')
  }

  if (loading) return <p className="text-center text-sumi-muted">加载中…</p>

  const filteredDecks = decks.filter((d) => d.cardType === cardType)
  const selectDecks = isEdit ? decks : filteredDecks

  return (
    <div>
      <h1 className="mb-4 text-xl font-medium">{isEdit ? '编辑闪卡' : '新建闪卡'}</h1>

      {decks.length === 0 ? (
        <p className="text-sumi-muted">
          请先{' '}
          <Link to="/decks/new" className="text-indigo-ja-dark">
            创建牌组
          </Link>
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {!isEdit && (
            <label className="flex flex-col gap-1">
              <span className="text-sm text-sumi-muted">类型</span>
              <select
                value={cardType}
                onChange={(e) => {
                  const t = e.target.value as CardType
                  setCardType(t)
                  const match = decks.find((d) => d.cardType === t)
                  if (match) setDeckId(match.id)
                  if (!isEdit) resetStructuredFields()
                }}
                className="rounded-lg border border-card-border bg-white px-3 py-2"
              >
                {(Object.keys(CARD_TYPE_LABELS) as CardType[]).map((t) => (
                  <option key={t} value={t}>
                    {CARD_TYPE_LABELS[t]}
                  </option>
                ))}
              </select>
            </label>
          )}

          <label className="flex flex-col gap-1">
            <span className="text-sm text-sumi-muted">牌组</span>
            <select
              value={deckId}
              onChange={(e) => setDeckId(e.target.value)}
              onFocus={() => {
                void loadDecks()
              }}
              className="rounded-lg border border-card-border bg-white px-3 py-2"
              required
            >
              {selectDecks.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}（{CARD_TYPE_LABELS[d.cardType]}）
                </option>
              ))}
            </select>
            {!isEdit && selectDecks.length === 0 && (
              <span className="text-xs text-sakura-deep">
                当前类型暂无牌组，请先创建同类型牌组。
              </span>
            )}
          </label>

          {cardType === 'vocabulary' && (
            <>
              <Field label="中文释义（正面）" value={meaningZh} onChange={setMeaningZh} required />
              <Field label="提示（可选）" value={hint} onChange={setHint} />
              <Field label="日语表达（背面）" value={expressionJa} onChange={setExpressionJa} required />
              <Field label="读音（可选）" value={reading} onChange={setReading} />
              <TextArea
                label="使用场景（每行一条）"
                value={vocabScenarios}
                onChange={setVocabScenarios}
              />
              <ExampleFields
                label="例句"
                value={vocabExamples}
                onChange={setVocabExamples}
              />
            </>
          )}

          {cardType === 'grammar' && (
            <>
              <Field label="核心句式（正面）" value={pattern} onChange={setPattern} required />
              <Field label="意思（背面）" value={grammarMeaning} onChange={setGrammarMeaning} required />
              <TextArea label="使用场景" value={grammarScenarios} onChange={setGrammarScenarios} />
              <ExampleFields
                label="例句"
                value={grammarExamples}
                onChange={setGrammarExamples}
              />
            </>
          )}

          {cardType === 'corpus' && (
            <>
              <Field label="口语场景（正面）" value={scenario} onChange={setScenario} required />
              <CorpusWordFields value={corpusWords} onChange={setCorpusWords} />
              <CorpusPhraseFields value={corpusPhrases} onChange={setCorpusPhrases} />
            </>
          )}

          <Field label="标签（逗号分隔，可选）" value={tags} onChange={setTags} />

          {isEdit && linkingCardSnapshot && (
            <section className="rounded-xl border border-card-border bg-white p-4">
              <div className="mb-3 flex items-center justify-between gap-2">
                <span className="text-sm font-medium text-indigo-ja-dark">关联对比</span>
                <button
                  type="button"
                  onClick={() => setShowLinkModal(true)}
                  className="rounded border border-card-border px-2 py-1 text-xs text-indigo-ja-dark hover:bg-washi"
                >
                  关联对比
                </button>
              </div>
              <LinkedCardsSection
                cards={linkedCardsPreview}
                emptyHint="尚未关联其他卡片，点击「管理关联」添加同类型对比卡。"
              />
            </section>
          )}

          <button
            type="submit"
            disabled={!isEdit && selectDecks.length === 0}
            className="rounded-xl bg-indigo-ja-dark py-3 text-white hover:bg-indigo-ja"
          >
            {isEdit ? '保存' : '创建'}
          </button>
        </form>
      )}

      {showLinkModal && linkingCardSnapshot && (
        <LinkCardsModal
          card={linkingCardSnapshot}
          allCards={allCards}
          onClose={() => setShowLinkModal(false)}
          onLinksChanged={refreshLinks}
        />
      )}
    </div>
  )
}

function Field({
  label,
  value,
  onChange,
  required,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  required?: boolean
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-sm text-sumi-muted">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        className="rounded-lg border border-card-border bg-white px-3 py-2"
      />
    </label>
  )
}

function TextArea({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-sm text-sumi-muted">{label}</span>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
        placeholder={placeholder}
        className="rounded-lg border border-card-border bg-white px-3 py-2"
      />
    </label>
  )
}
