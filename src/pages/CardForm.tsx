import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { ContrastFormFields, emptyContrastEntry } from '../components/ContrastFields'
import { CorpusPhraseFields, CorpusWordFields } from '../components/CorpusFields'
import { ExampleFields } from '../components/ExampleFields'
import { PitfallsFields } from '../components/PitfallsFields'
import { LinkCardsModal } from '../components/LinkCardsModal'
import { LinkedCardsSection } from '../components/LinkedCardsSection'
import { getAllCards, getAllDecks, getCard, saveCard, saveDeck } from '../lib/db'
import { normalizeExampleList } from '../lib/example-text'
import { generateId } from '../lib/id'
import {
  CARD_TYPE_LABELS,
  createDefaultReview,
  type Card,
  type CardType,
  type ContrastCard,
  type ContrastEntry,
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
  const [vocabPitfallsText, setVocabPitfallsText] = useState('')

  // Grammar
  const [pattern, setPattern] = useState('')
  const [grammarMeaning, setGrammarMeaning] = useState('')
  const [grammarScenarios, setGrammarScenarios] = useState('')
  const [grammarExamples, setGrammarExamples] = useState<ExamplePair[]>([{ ja: '', zh: '' }])
  const [grammarPitfallsText, setGrammarPitfallsText] = useState('')

  // Corpus
  const [scenario, setScenario] = useState('')
  const [corpusWords, setCorpusWords] = useState<CorpusWord[]>([])
  const [corpusPhrases, setCorpusPhrases] = useState<CorpusPhrase[]>([])
  const [corpusPitfallsText, setCorpusPitfallsText] = useState('')

  // Contrast
  const [contrastTitle, setContrastTitle] = useState('')
  const [contrastPrompt, setContrastPrompt] = useState('')
  const [contrastItems, setContrastItems] = useState<ContrastEntry[]>([
    emptyContrastEntry(),
    emptyContrastEntry(),
  ])
  const [contrastPitfallsText, setContrastPitfallsText] = useState('')

  const [tags, setTags] = useState('')
  const [editingCard, setEditingCard] = useState<Card | null>(null)
  const [linkedCardIds, setLinkedCardIds] = useState<string[]>([])
  const [allCards, setAllCards] = useState<Card[]>([])
  const [showLinkModal, setShowLinkModal] = useState(false)
  const [showNewDeckForm, setShowNewDeckForm] = useState(false)
  const [newDeckName, setNewDeckName] = useState('')
  const [creatingDeck, setCreatingDeck] = useState(false)

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

  const loadDecks = useCallback(async (): Promise<Deck[]> => {
    const list = normalizeDecks(await getAllDecks())
    setDecks(list)
    return list
  }, [])

  const pickDeckForType = useCallback((list: Deck[], type: CardType, preferredId?: string) => {
    const matches = list.filter((d) => d.cardType === type)
    if (preferredId && matches.some((d) => d.id === preferredId)) return preferredId
    return matches[0]?.id ?? ''
  }, [])

  const createDeckForType = useCallback(
    async (name: string, type: CardType): Promise<string | null> => {
      const trimmed = name.trim()
      if (!trimmed) {
        alert('请输入牌组名称')
        return null
      }
      const now = new Date().toISOString()
      const deck: Deck = {
        id: generateId(),
        name: trimmed,
        cardType: type,
        createdAt: now,
        updatedAt: now,
      }
      await saveDeck(deck)
      await loadDecks()
      setDeckId(deck.id)
      setShowNewDeckForm(false)
      setNewDeckName('')
      return deck.id
    },
    [loadDecks],
  )

  useEffect(() => {
    void loadDecks().then((list) => {
      if (isEdit) return
      if (presetDeckId) {
        const preset = list.find((d) => d.id === presetDeckId)
        if (preset) {
          setCardType(preset.cardType)
          setDeckId(preset.id)
          setShowNewDeckForm(false)
          return
        }
      }
      const typeParam = searchParams.get('type') as CardType | null
      const initialType =
        typeParam && typeParam in CARD_TYPE_LABELS ? typeParam : cardType
      if (typeParam && typeParam in CARD_TYPE_LABELS) {
        setCardType(typeParam)
      }
      const id = pickDeckForType(list, initialType, undefined)
      setDeckId(id)
      setShowNewDeckForm(!id)
    })
    // 仅在新卡初次挂载时根据 URL 预设牌组/类型
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadDecks, isEdit, presetDeckId, pickDeckForType])

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
        setVocabPitfallsText((card.back.pitfalls ?? []).join('\n'))
      } else if (card.type === 'grammar') {
        setPattern(card.front.pattern)
        setGrammarMeaning(card.back.meaningZh)
        setGrammarScenarios(card.back.scenarios.join('\n'))
        setGrammarExamples(
          card.back.examples.length > 0 ? card.back.examples : [{ ja: '', zh: '' }],
        )
        setGrammarPitfallsText((card.back.pitfalls ?? []).join('\n'))
      } else if (card.type === 'corpus') {
        setScenario(card.front.scenario)
        setCorpusWords(card.back.words)
        setCorpusPhrases(card.back.phrases)
        setCorpusPitfallsText((card.back.pitfalls ?? []).join('\n'))
      } else {
        setContrastTitle(card.front.title)
        setContrastPrompt(card.front.prompt ?? '')
        setContrastItems(
          card.back.items.map((item) => ({
            ...item,
            examples: item.examples.length > 0 ? item.examples : [{ ja: '', zh: '' }],
          })),
        )
        setContrastPitfallsText((card.back.pitfalls ?? []).join('\n'))
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
    setVocabPitfallsText('')
    setGrammarExamples([{ ja: '', zh: '' }])
    setGrammarPitfallsText('')
    setCorpusWords([])
    setCorpusPhrases([])
    setCorpusPitfallsText('')
    setContrastItems([emptyContrastEntry(), emptyContrastEntry()])
    setContrastPitfallsText('')
  }

  const normalizeContrastEntry = (entry: ContrastEntry): ContrastEntry => ({
    label: entry.label.trim(),
    connection: entry.connection?.trim() || undefined,
    subtitle: entry.subtitle?.trim() || undefined,
    examples: normalizeExampleList(entry.examples),
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    let targetDeckId = deckId
    if (!targetDeckId && !isEdit) {
      if (newDeckName.trim()) {
        setCreatingDeck(true)
        targetDeckId = (await createDeckForType(newDeckName, cardType)) ?? ''
        setCreatingDeck(false)
      }
      if (!targetDeckId) {
        alert('请选择牌组，或填写名称新建牌组')
        return
      }
    }
    if (!targetDeckId) {
      alert('请选择牌组')
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
    const vocabPitfalls = parseLines(vocabPitfallsText)
    const grammarPitfalls = parseLines(grammarPitfallsText)
    const corpusPitfalls = parseLines(corpusPitfallsText)
    if (cardType === 'vocabulary') {
      card = {
        id,
        deckId: targetDeckId,
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
          pitfalls: vocabPitfalls.length > 0 ? vocabPitfalls : undefined,
        },
      } satisfies VocabularyCard
    } else if (cardType === 'grammar') {
      card = {
        id,
        deckId: targetDeckId,
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
          pitfalls: grammarPitfalls.length > 0 ? grammarPitfalls : undefined,
        },
      } satisfies GrammarCard
    } else if (cardType === 'corpus') {
      const words = normalizeCorpusWords(corpusWords)
      const phrases = normalizeCorpusPhrases(corpusPhrases)

      card = {
        id,
        deckId: targetDeckId,
        type: 'corpus',
        tags: tagList,
        createdAt,
        updatedAt: now,
        review,
        linkedCardIds: savedLinkedIds,
        front: { scenario: scenario.trim() },
        back: {
          words,
          phrases,
          pitfalls: corpusPitfalls.length > 0 ? corpusPitfalls : undefined,
        },
      } satisfies CorpusCard
    } else {
      const items = contrastItems
        .map(normalizeContrastEntry)
        .filter((item) => item.label)
      if (items.length < 2) {
        alert('请至少填写 2 个对比项')
        return
      }

      const pitfalls = parseLines(contrastPitfallsText)

      card = {
        id,
        deckId: targetDeckId,
        type: 'contrast',
        tags: tagList,
        createdAt,
        updatedAt: now,
        review,
        linkedCardIds: savedLinkedIds,
        front: {
          title: contrastTitle.trim(),
          prompt: contrastPrompt.trim() || undefined,
        },
        back: {
          items,
          pitfalls: pitfalls.length > 0 ? pitfalls : undefined,
        },
      } satisfies ContrastCard
    }

    await saveCard(card)
    navigate(`/decks/${targetDeckId}`)
  }

  if (loading) return <p className="text-center text-sumi-muted">加载中…</p>

  const filteredDecks = decks.filter((d) => d.cardType === cardType)
  const selectDecks = isEdit ? decks : filteredDecks
  const canSubmitNew =
    isEdit || selectDecks.length > 0 || Boolean(deckId) || newDeckName.trim().length > 0

  const handleTypeChange = (t: CardType) => {
    setCardType(t)
    const nextDeckId = pickDeckForType(decks, t, deckId)
    setDeckId(nextDeckId)
    setShowNewDeckForm(!nextDeckId)
    resetStructuredFields()
  }

  const handleCreateDeckClick = async () => {
    setCreatingDeck(true)
    await createDeckForType(newDeckName, cardType)
    setCreatingDeck(false)
  }

  return (
    <div>
      <h1 className="mb-4 text-xl font-medium">{isEdit ? '编辑闪卡' : '新建闪卡'}</h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {!isEdit && (
            <label className="flex flex-col gap-1">
              <span className="text-sm text-sumi-muted">类型</span>
              <select
                value={cardType}
                onChange={(e) => handleTypeChange(e.target.value as CardType)}
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

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm text-sumi-muted">牌组</span>
              {!isEdit && (
                <button
                  type="button"
                  onClick={() => setShowNewDeckForm((v) => !v)}
                  className="text-xs text-indigo-ja-dark hover:underline"
                >
                  {showNewDeckForm ? '取消新建' : '＋ 新建牌组'}
                </button>
              )}
            </div>

            {selectDecks.length > 0 && (
              <select
                value={deckId}
                onChange={(e) => setDeckId(e.target.value)}
                onFocus={() => {
                  void loadDecks()
                }}
                className="rounded-lg border border-card-border bg-white px-3 py-2"
                required={isEdit || (!showNewDeckForm && !newDeckName.trim())}
              >
                {!isEdit && !deckId && <option value="">选择牌组</option>}
                {selectDecks.map((d) => (
                  <option key={d.id} value={d.id}>
                    {isEdit ? `${d.name}（${CARD_TYPE_LABELS[d.cardType]}）` : d.name}
                  </option>
                ))}
              </select>
            )}

            {!isEdit && selectDecks.length === 0 && !showNewDeckForm && (
              <p className="text-xs text-sumi-muted">当前类型暂无牌组，请新建牌组。</p>
            )}

            {!isEdit && (showNewDeckForm || selectDecks.length === 0) && (
              <div className="rounded-xl border border-dashed border-card-border bg-washi/50 p-3">
                <p className="mb-2 text-xs text-sumi-muted">
                  新建 {CARD_TYPE_LABELS[cardType]} 牌组
                </p>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                  <input
                    value={newDeckName}
                    onChange={(e) => setNewDeckName(e.target.value)}
                    placeholder="牌组名称"
                    className="min-w-0 flex-1 rounded-lg border border-card-border bg-white px-3 py-2"
                  />
                  <button
                    type="button"
                    disabled={creatingDeck || !newDeckName.trim()}
                    onClick={() => void handleCreateDeckClick()}
                    className="shrink-0 rounded-lg border border-indigo-ja/30 bg-white px-4 py-2 text-sm text-indigo-ja-dark hover:bg-washi disabled:opacity-50"
                  >
                    {creatingDeck ? '创建中…' : '创建牌组'}
                  </button>
                </div>
                <p className="mt-2 text-xs text-sumi-muted">
                  也可直接填写名称后点「创建」闪卡，将一并新建牌组。
                </p>
              </div>
            )}
          </div>

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
              <PitfallsFields value={vocabPitfallsText} onChange={setVocabPitfallsText} />
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
              <PitfallsFields value={grammarPitfallsText} onChange={setGrammarPitfallsText} />
            </>
          )}

          {cardType === 'corpus' && (
            <>
              <Field label="口语场景（正面）" value={scenario} onChange={setScenario} required />
              <CorpusWordFields value={corpusWords} onChange={setCorpusWords} />
              <CorpusPhraseFields value={corpusPhrases} onChange={setCorpusPhrases} />
              <PitfallsFields value={corpusPitfallsText} onChange={setCorpusPitfallsText} />
            </>
          )}

          {cardType === 'contrast' && (
            <ContrastFormFields
              title={contrastTitle}
              onTitleChange={setContrastTitle}
              prompt={contrastPrompt}
              onPromptChange={setContrastPrompt}
              items={contrastItems}
              onItemsChange={setContrastItems}
              pitfallsText={contrastPitfallsText}
              onPitfallsTextChange={setContrastPitfallsText}
            />
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
            disabled={!isEdit && !canSubmitNew}
            className="rounded-xl bg-indigo-ja-dark py-3 text-white hover:bg-indigo-ja disabled:opacity-50"
          >
            {isEdit ? '保存' : creatingDeck ? '处理中…' : '创建'}
          </button>
        </form>

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
