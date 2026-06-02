import { useState } from 'react'
import { countInvalidExampleLines, parseExampleLines } from '../lib/parse-card-fields'
import type { ExamplePair } from '../lib/types'

interface ExampleFieldsProps {
  label: string
  value: ExamplePair[]
  onChange: (examples: ExamplePair[]) => void
}

export function ExampleFields({ label, value, onChange }: ExampleFieldsProps) {
  const [bulkText, setBulkText] = useState('')
  const rows = value.length > 0 ? value : [{ ja: '', zh: '' }]

  const applyBulkPaste = () => {
    const trimmed = bulkText.trim()
    if (!trimmed) return
    const invalid = countInvalidExampleLines(trimmed)
    const parsed = parseExampleLines(trimmed)
    if (parsed.length === 0) {
      window.alert('未能识别例句，请使用「日语|中文」或「日语｜中文」格式，每行一条。')
      return
    }
    if (invalid > 0) {
      window.alert(`已导入 ${parsed.length} 条例句，有 ${invalid} 行格式无效已跳过。`)
    }
    const existing = normalizeExamples(value)
    onChange([...existing, ...parsed])
    setBulkText('')
  }

  const updateRow = (index: number, field: 'ja' | 'zh', text: string) => {
    const next = rows.map((row, i) => (i === index ? { ...row, [field]: text } : row))
    onChange(next)
  }

  const addRow = () => {
    onChange([...rows, { ja: '', zh: '' }])
  }

  const removeRow = (index: number) => {
    const next = rows.filter((_, i) => i !== index)
    onChange(next.length > 0 ? next : [{ ja: '', zh: '' }])
  }

  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm text-sumi-muted">{label}</span>
      <div className="space-y-2">
        {rows.map((row, index) => (
          <div
            key={index}
            className="grid grid-cols-1 gap-2 rounded-lg border border-card-border bg-white p-2 sm:grid-cols-[1fr_1fr_auto]"
          >
            <input
              value={row.ja}
              onChange={(e) => updateRow(index, 'ja', e.target.value)}
              placeholder="日语例句"
              className="rounded-lg border border-card-border px-3 py-2 text-sm"
            />
            <input
              value={row.zh}
              onChange={(e) => updateRow(index, 'zh', e.target.value)}
              placeholder="中文释义"
              className="rounded-lg border border-card-border px-3 py-2 text-sm"
            />
            <button
              type="button"
              onClick={() => removeRow(index)}
              disabled={rows.length === 1 && !row.ja && !row.zh}
              className="rounded border border-card-border px-2 py-1 text-xs text-sumi-muted hover:bg-washi disabled:opacity-40"
              aria-label="删除例句"
            >
              删除
            </button>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={addRow}
        className="self-start rounded-lg border border-dashed border-indigo-ja/40 px-3 py-1.5 text-sm text-indigo-ja-dark hover:bg-indigo-ja/5"
      >
        ＋ 添加例句
      </button>
      <div className="mt-1 flex flex-col gap-1">
        <span className="text-xs text-sumi-muted">批量粘贴（每行：日语|中文，支持全角｜）</span>
        <textarea
          value={bulkText}
          onChange={(e) => setBulkText(e.target.value)}
          rows={2}
          placeholder="お会計お願いします|请结账"
          className="rounded-lg border border-card-border bg-white px-3 py-2 text-sm"
        />
        <button
          type="button"
          onClick={applyBulkPaste}
          disabled={!bulkText.trim()}
          className="self-start rounded border border-card-border px-2 py-1 text-xs text-indigo-ja-dark hover:bg-washi disabled:opacity-40"
        >
          导入到例句列表
        </button>
      </div>
    </div>
  )
}

function normalizeExamples(examples: ExamplePair[]): ExamplePair[] {
  return examples
    .map((e) => ({ ja: e.ja.trim(), zh: e.zh.trim() }))
    .filter((e) => e.ja && e.zh)
}
