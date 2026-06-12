import { ExampleLine } from './ExampleDisplay'
import { PitfallsSection } from './PitfallsSection'
import {
  CARD_TYPE_LABELS,
  FAMILIARITY_LABELS,
  getCardBrief,
  getCardPitfalls,
  isContrastCard,
  isCorpusCard,
  isGrammarCard,
  isVocabularyCard,
  type Card,
  type ExamplePair,
} from '../lib/types'

interface LinkedCardsSectionProps {
  cards: Card[]
  emptyHint?: string
  onCardClick?: (card: Card) => void
}

export function LinkedCardsSection({
  cards,
  emptyHint = '当前卡片暂无关联，可在牌组页为闪卡添加关联对比。',
  onCardClick,
}: LinkedCardsSectionProps) {
  return (
    <section className="rounded-xl border border-card-border bg-white p-4">
      <h3 className="mb-3 text-sm font-medium text-indigo-ja-dark">
        关联卡片
        {cards.length > 0 && (
          <span className="ml-2 font-normal text-sumi-muted">({cards.length})</span>
        )}
      </h3>
      {cards.length === 0 ? (
        <p className="text-sm text-sumi-muted">{emptyHint}</p>
      ) : (
        <div className="space-y-2">
          {cards.map((card) => {
            const inner = <LinkedCardContent card={card} />
            if (onCardClick) {
              return (
                <button
                  key={card.id}
                  type="button"
                  onClick={() => onCardClick(card)}
                  className="w-full rounded-lg border border-card-border bg-washi/60 px-3 py-2 text-left transition-colors hover:bg-washi"
                >
                  {inner}
                </button>
              )
            }
            return (
              <article
                key={card.id}
                className="rounded-lg border border-card-border bg-washi/60 px-3 py-2"
              >
                {inner}
              </article>
            )
          })}
        </div>
      )}
    </section>
  )
}

function LinkedCardContent({ card }: { card: Card }) {
  const brief = getCardBrief(card)

  return (
    <>
      <p className="text-sm font-medium text-sumi">{brief.ja}</p>
      <p className="mt-0.5 text-sm text-sumi-muted">{brief.zh}</p>
      <p className="mt-1 text-xs text-sumi-muted">
        {CARD_TYPE_LABELS[card.type]} · 熟悉程度：
        {FAMILIARITY_LABELS[card.review.familiarity]}
      </p>
      <LinkedCardScenariosAndExamples card={card} />
    </>
  )
}

function LinkedCardScenariosAndExamples({ card }: { card: Card }) {
  if (isVocabularyCard(card)) {
    const scenarios = card.back.scenarios
    const examples = card.back.examples ?? []
    const pitfalls = getCardPitfalls(card)
    if (scenarios.length === 0 && examples.length === 0 && pitfalls.length === 0) return null
    return (
      <div className="mt-2 space-y-2 border-t border-card-border/60 pt-2">
        {scenarios.length > 0 && (
          <ScenariosBlock items={scenarios} />
        )}
        {examples.length > 0 && <ExamplesBlock examples={examples} />}
        <PitfallsSection pitfalls={pitfalls} />
      </div>
    )
  }

  if (isGrammarCard(card)) {
    const { scenarios, examples } = card.back
    const pitfalls = getCardPitfalls(card)
    if (scenarios.length === 0 && examples.length === 0 && pitfalls.length === 0) return null
    return (
      <div className="mt-2 space-y-2 border-t border-card-border/60 pt-2">
        {scenarios.length > 0 && <ScenariosBlock items={scenarios} />}
        {examples.length > 0 && <ExamplesBlock examples={examples} />}
        <PitfallsSection pitfalls={pitfalls} />
      </div>
    )
  }

  if (isContrastCard(card)) {
    const { items } = card.back
    const pitfalls = getCardPitfalls(card)
    const hasExamples = items.some(
      (entry) => entry.examples.length > 0 || Boolean(entry.connection?.trim()),
    )
    if (!hasExamples && pitfalls.length === 0) return null
    return (
      <div className="mt-2 space-y-2 border-t border-card-border/60 pt-2">
        {items.map((entry, idx) => {
          const hasContent = entry.examples.length > 0 || Boolean(entry.connection?.trim())
          if (!hasContent) return null
          return (
            <div key={idx}>
              <p className="mb-1 text-xs font-medium text-sakura-deep">
                对比项 {idx + 1}：{entry.label}
              </p>
              {entry.connection && (
                <p className="mb-1 text-sm text-sumi">
                  <span className="font-medium text-indigo-ja-dark">接续：</span>
                  {entry.connection}
                </p>
              )}
              {entry.examples.length > 0 && <ExamplesBlock examples={entry.examples} />}
            </div>
          )
        })}
        <PitfallsSection pitfalls={pitfalls} />
      </div>
    )
  }

  if (isCorpusCard(card)) {
    const scenario = card.front.scenario.trim()
    const words = card.back.words
    const phrases = card.back.phrases
    const examples = card.back.examples ?? []
    const pitfalls = getCardPitfalls(card)
    const hasWords = words.some(
      (w) => w.ja || w.zh || (w.collocations?.length ?? 0) > 0,
    )
    if (
      !scenario &&
      !hasWords &&
      phrases.length === 0 &&
      examples.length === 0 &&
      pitfalls.length === 0
    ) {
      return null
    }
    return (
      <div className="mt-2 space-y-2 border-t border-card-border/60 pt-2">
        {scenario && (
          <div>
            <p className="mb-1 text-xs font-medium text-sakura-deep">使用场景</p>
            <p className="text-sm text-sumi">{scenario}</p>
          </div>
        )}
        {hasWords && (
          <div>
            <p className="mb-1 text-xs font-medium text-sakura-deep">常用单词</p>
            <ul className="space-y-1.5">
              {words.map((w, i) => (
                <li key={i} className="text-sm">
                  <p className="text-sumi">
                    {w.ja}
                    {w.reading && <span className="ml-1 text-sumi-muted">({w.reading})</span>}
                    <span className="mx-1 text-sumi-muted">·</span>
                    <span className="text-sumi-muted">{w.zh}</span>
                  </p>
                  {(w.collocations?.length ?? 0) > 0 && (
                    <ul className="mt-1 space-y-1 border-l-2 border-indigo-ja/20 pl-2">
                      {w.collocations!.map((c, j) => (
                        <li key={j}>
                          <p className="text-sumi">{c.ja}</p>
                          <p className="text-sumi-muted">{c.zh}</p>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
        {phrases.length > 0 && (
          <div>
            <p className="mb-1 text-xs font-medium text-sakura-deep">常用句式</p>
            <ul className="space-y-1.5">
              {phrases.map((p, i) => (
                <li key={i} className="text-sm">
                  <p className="text-sumi">{p.ja}</p>
                  <p className="text-sumi-muted">{p.zh}</p>
                </li>
              ))}
            </ul>
          </div>
        )}
        {examples.length > 0 && (
          <div>
            <p className="mb-1 text-xs font-medium text-sakura-deep">典型例句</p>
            <ul className="space-y-1.5">
              {examples.map((ex, i) => (
                <li key={i} className="text-sm">
                  <ExampleLine ex={ex} />
                </li>
              ))}
            </ul>
          </div>
        )}
        <PitfallsSection pitfalls={pitfalls} />
      </div>
    )
  }

  return null
}

function ScenariosBlock({ items }: { items: string[] }) {
  return (
    <div>
      <p className="mb-1 text-xs font-medium text-sakura-deep">使用场景</p>
      <ul className="list-inside list-disc text-sm text-sumi">
        {items.map((s, i) => (
          <li key={i}>{s}</li>
        ))}
      </ul>
    </div>
  )
}

function ExamplesBlock({ examples }: { examples: ExamplePair[] }) {
  return (
    <div>
      <p className="mb-1 text-xs font-medium text-sakura-deep">例句</p>
      <ul className="space-y-1.5">
        {examples.map((ex, i) => (
          <li key={i} className="rounded-md bg-white/80 px-2 py-1.5 text-sm whitespace-pre-wrap">
            <ExampleLine ex={ex} />
          </li>
        ))}
      </ul>
    </div>
  )
}
