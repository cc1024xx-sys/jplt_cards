import { ExampleLine } from './ExampleDisplay'
import {
  CARD_TYPE_LABELS,
  FAMILIARITY_LABELS,
  getCardBrief,
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
    if (scenarios.length === 0 && examples.length === 0) return null
    return (
      <div className="mt-2 space-y-2 border-t border-card-border/60 pt-2">
        {scenarios.length > 0 && (
          <ScenariosBlock items={scenarios} />
        )}
        {examples.length > 0 && <ExamplesBlock examples={examples} />}
      </div>
    )
  }

  if (isGrammarCard(card)) {
    const { scenarios, examples } = card.back
    if (scenarios.length === 0 && examples.length === 0) return null
    return (
      <div className="mt-2 space-y-2 border-t border-card-border/60 pt-2">
        {scenarios.length > 0 && <ScenariosBlock items={scenarios} />}
        {examples.length > 0 && <ExamplesBlock examples={examples} />}
      </div>
    )
  }

  if (isCorpusCard(card)) {
    const scenario = card.front.scenario.trim()
    const phrases = card.back.phrases
    if (!scenario && phrases.length === 0) return null
    return (
      <div className="mt-2 space-y-2 border-t border-card-border/60 pt-2">
        {scenario && (
          <div>
            <p className="mb-1 text-xs font-medium text-sakura-deep">使用场景</p>
            <p className="text-sm text-sumi">{scenario}</p>
          </div>
        )}
        {phrases.length > 0 && (
          <div>
            <p className="mb-1 text-xs font-medium text-sakura-deep">例句</p>
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
