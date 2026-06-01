import { useState } from 'react'
import type { Card } from '../lib/types'
import { isCorpusCard, isGrammarCard, isVocabularyCard } from '../lib/types'

export function CardFront({
  card,
  copiedKey,
  onCopy,
}: {
  card: Card
  copiedKey: string | null
  onCopy: (text: string, key: string) => Promise<void>
}) {
  if (isVocabularyCard(card)) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2">
        <div className="flex items-center gap-2">
          <p className="text-2xl font-medium text-sumi">{card.front.meaningZh}</p>
          <CopyButton
            text={card.front.meaningZh}
            copyKey={`front-meaning-${card.id}`}
            copiedKey={copiedKey}
            onCopy={onCopy}
          />
        </div>
        {card.front.hint && <p className="text-sm text-sumi-muted">{card.front.hint}</p>}
      </div>
    )
  }
  if (isGrammarCard(card)) {
    return (
      <div className="flex h-full flex-col items-center justify-center">
        <div className="flex items-center gap-2">
          <p className="text-2xl font-medium text-indigo-ja-dark">{card.front.pattern}</p>
          <CopyButton
            text={card.front.pattern}
            copyKey={`front-pattern-${card.id}`}
            copiedKey={copiedKey}
            onCopy={onCopy}
          />
        </div>
      </div>
    )
  }
  if (isCorpusCard(card)) {
    return (
      <div className="flex h-full flex-col items-center justify-center">
        <div className="flex items-center gap-2">
          <p className="text-center text-xl font-medium text-sumi">{card.front.scenario}</p>
          <CopyButton
            text={card.front.scenario}
            copyKey={`front-scenario-${card.id}`}
            copiedKey={copiedKey}
            onCopy={onCopy}
          />
        </div>
      </div>
    )
  }
  return null
}

export function CardBack({
  card,
  copiedKey,
  onCopy,
}: {
  card: Card
  copiedKey: string | null
  onCopy: (text: string, key: string) => Promise<void>
}) {
  if (isVocabularyCard(card)) {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <p className="text-2xl text-sumi">{card.back.expressionJa}</p>
          <CopyButton
            text={card.back.expressionJa}
            copyKey={`back-expression-${card.id}`}
            copiedKey={copiedKey}
            onCopy={onCopy}
          />
        </div>
        {card.back.reading && (
          <div className="flex items-center gap-2">
            <p className="text-lg text-sumi-muted">{card.back.reading}</p>
            <CopyButton
              text={card.back.reading}
              copyKey={`back-reading-${card.id}`}
              copiedKey={copiedKey}
              onCopy={onCopy}
            />
          </div>
        )}
        {card.back.scenarios.length > 0 && (
          <div>
            <p className="mb-1 text-xs font-medium uppercase tracking-wider text-sakura-deep">
              使用场景
            </p>
            <ul className="list-inside list-disc text-sm text-sumi">
              {card.back.scenarios.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ul>
          </div>
        )}
        {card.back.examples?.map((ex, i) => (
          <div key={i} className="rounded-lg bg-washi p-3 text-sm">
            <div className="flex items-center gap-2">
              <p className="text-sumi">{ex.ja}</p>
              <CopyButton
                text={ex.ja}
                copyKey={`vocab-example-ja-${card.id}-${i}`}
                copiedKey={copiedKey}
                onCopy={onCopy}
              />
            </div>
            <p className="mt-1 text-sumi-muted">{ex.zh}</p>
          </div>
        ))}
      </div>
    )
  }
  if (isGrammarCard(card)) {
    return (
      <div className="flex flex-col gap-4">
        <p className="text-lg font-medium text-sumi">{card.back.meaningZh}</p>
        {card.back.scenarios.length > 0 && (
          <div>
            <p className="mb-1 text-xs font-medium text-sakura-deep">使用场景</p>
            <ul className="list-inside list-disc text-sm">
              {card.back.scenarios.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ul>
          </div>
        )}
        {card.back.examples.map((ex, i) => (
          <div key={i} className="rounded-lg bg-washi p-3 text-sm">
            <div className="flex items-center gap-2">
              <p>{ex.ja}</p>
              <CopyButton
                text={ex.ja}
                copyKey={`grammar-example-ja-${card.id}-${i}`}
                copiedKey={copiedKey}
                onCopy={onCopy}
              />
            </div>
            <p className="mt-1 text-sumi-muted">{ex.zh}</p>
          </div>
        ))}
      </div>
    )
  }
  if (isCorpusCard(card)) {
    return (
      <div className="flex flex-col gap-4">
        {card.back.words.length > 0 && (
          <div>
            <p className="mb-2 text-xs font-medium text-matcha-deep">常用单词</p>
            <div className="space-y-2">
              {card.back.words.map((w, i) => (
                <div key={i} className="flex justify-between gap-2 text-sm">
                  <div className="flex items-center gap-2">
                    <span>
                      {w.ja}
                      {w.reading && <span className="ml-1 text-sumi-muted">({w.reading})</span>}
                    </span>
                    <CopyButton
                      text={w.ja}
                      copyKey={`corpus-word-ja-${card.id}-${i}`}
                      copiedKey={copiedKey}
                      onCopy={onCopy}
                    />
                  </div>
                  <span className="text-sumi-muted">{w.zh}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        {card.back.phrases.length > 0 && (
          <div>
            <p className="mb-2 text-xs font-medium text-indigo-ja">常用句式</p>
            <div className="space-y-2">
              {card.back.phrases.map((p, i) => (
                <div key={i} className="rounded-lg bg-washi p-2 text-sm">
                  <div className="flex items-center gap-2">
                    <p>{p.ja}</p>
                    <CopyButton
                      text={p.ja}
                      copyKey={`corpus-phrase-ja-${card.id}-${i}`}
                      copiedKey={copiedKey}
                      onCopy={onCopy}
                    />
                  </div>
                  <p className="text-sumi-muted">{p.zh}</p>
                  {p.note && <p className="mt-1 text-xs text-sumi-muted">{p.note}</p>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }
  return null
}

function CopyButton({
  text,
  copyKey,
  copiedKey,
  onCopy,
}: {
  text: string
  copyKey: string
  copiedKey: string | null
  onCopy: (text: string, key: string) => Promise<void>
}) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation()
        void onCopy(text, copyKey)
      }}
      className="rounded border border-card-border px-2 py-0.5 text-xs text-sumi-muted transition-colors hover:bg-washi"
      aria-label={`复制：${text}`}
    >
      {copiedKey === copyKey ? '已复制' : '复制'}
    </button>
  )
}

export function useCardCopy() {
  const [copiedKey, setCopiedKey] = useState<string | null>(null)

  const handleCopy = async (text: string, key: string) => {
    const value = text.trim()
    if (!value) return
    try {
      await navigator.clipboard.writeText(value)
      setCopiedKey(key)
      window.setTimeout(() => setCopiedKey((prev) => (prev === key ? null : prev)), 1200)
    } catch {
      window.alert('复制失败，请检查浏览器剪贴板权限')
    }
  }

  return { copiedKey, handleCopy }
}
