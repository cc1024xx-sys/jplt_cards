import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { ExampleFields } from '../components/ExampleFields'
import { getAllDecks, getCard, saveCard } from '../lib/db'
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
  const [vocabExamples, setVocabExamples] = useState<ExamplePair[]>([])

  // Grammar
  const [pattern, setPattern] = useState('')
  const [grammarMeaning, setGrammarMeaning] = useState('')
  const [grammarScenarios, setGrammarScenarios] = useState('')
  const [grammarExamples, setGrammarExamples] = useState<ExamplePair[]>([])

  // Corpus
  const [scenario, setScenario] = useState('')
  const [corpusWords, setCorpusWords] = useState('')
  const [corpusPhrases, setCorpusPhrases] = useState('')

  const [tags, setTags] = useState('')

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
        setVocabExamples(card.back.examples ?? [])
      } else if (card.type === 'grammar') {
        setPattern(card.front.pattern)
        setGrammarMeaning(card.back.meaningZh)
        setGrammarScenarios(card.back.scenarios.join('\n'))
        setGrammarExamples(card.back.examples)
      } else {
        setScenario(card.front.scenario)
        setCorpusWords(
          card.back.words.map((w) => `${w.ja}|${w.zh}|${w.reading ?? ''}`).join('\n'),
        )
        setCorpusPhrases(
          card.back.phrases
            .map((p) => `${p.ja}|${p.zh}|${p.note ?? ''}`)
            .join('\n'),
        )
      }
      setLoading(false)
    })
  }, [cardId, navigate])

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

  const normalizeExamples = (examples: ExamplePair[]): ExamplePair[] =>
    examples
      .map((e) => ({ ja: e.ja.trim(), zh: e.zh.trim() }))
      .filter((e) => e.ja && e.zh)

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
    const linkedCardIds = existing?.linkedCardIds ?? []

    const vocabExampleList = normalizeExamples(vocabExamples)
    const grammarExampleList = normalizeExamples(grammarExamples)

    if (cardType === 'vocabulary') {
      card = {
        id,
        deckId,
        type: 'vocabulary',
        tags: tagList,
        createdAt,
        updatedAt: now,
        review,
        linkedCardIds,
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
        linkedCardIds,
        front: { pattern: pattern.trim() },
        back: {
          meaningZh: grammarMeaning.trim(),
          scenarios: parseLines(grammarScenarios),
          examples: grammarExampleList,
        },
      } satisfies GrammarCard
    } else {
      const words: CorpusWord[] = []
      for (const line of parseLines(corpusWords)) {
        const [ja, zh, r] = line.split('|').map((s) => s.trim())
        if (ja && zh) words.push({ ja, zh, reading: r || undefined })
      }

      const phrases: CorpusPhrase[] = []
      for (const line of parseLines(corpusPhrases)) {
        const [ja, zh, note] = line.split('|').map((s) => s.trim())
        if (ja && zh) phrases.push({ ja, zh, note: note || undefined })
      }

      card = {
        id,
        deckId,
        type: 'corpus',
        tags: tagList,
        createdAt,
        updatedAt: now,
        review,
        linkedCardIds,
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
              <TextArea
                label="常用单词（每行：日语|中文|读音可选）"
                value={corpusWords}
                onChange={setCorpusWords}
                placeholder="コーヒー|咖啡"
              />
              <TextArea
                label="常用句式（每行：日语|中文|备注可选）"
                value={corpusPhrases}
                onChange={setCorpusPhrases}
                placeholder="これください|请给我这个"
              />
            </>
          )}

          <Field label="标签（逗号分隔，可选）" value={tags} onChange={setTags} />

          <button
            type="submit"
            disabled={!isEdit && selectDecks.length === 0}
            className="rounded-xl bg-indigo-ja-dark py-3 text-white hover:bg-indigo-ja"
          >
            {isEdit ? '保存' : '创建'}
          </button>
        </form>
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
