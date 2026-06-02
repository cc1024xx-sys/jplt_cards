import type { ExamplePair } from './types'

function normalizeNewlines(text: string): string {
  return text.replace(/\r\n/g, '\n')
}

/** 编辑/展示：合并为自由文本（兼容旧数据中的 ja + zh） */
export function formatExampleText(ex: ExamplePair): string {
  const ja = normalizeNewlines(ex.ja)
  const zh = ex.zh.trim()
  if (ja.trim() && zh) return `${ja.trimEnd()}\n${zh}`
  return ja
}

export function exampleFromText(text: string): ExamplePair {
  return { ja: normalizeNewlines(text), zh: '' }
}

export function normalizeExampleList(examples: ExamplePair[]): ExamplePair[] {
  return examples
    .map((e) => exampleFromText(formatExampleText(e)))
    .filter((e) => e.ja.trim().length > 0)
}
