import { useState, type ReactNode } from 'react'
import {
  countInvalidCorpusPhraseLines,
  countInvalidCorpusWordLines,
  parseCorpusPhraseLines,
  parseCorpusWordLines,
} from '../lib/parse-card-fields'
import type { CorpusPhrase, CorpusWord } from '../lib/types'

type WordRow = { ja: string; zh: string; reading: string }
type PhraseRow = { ja: string; zh: string; note: string }

interface CorpusWordFieldsProps {
  value: CorpusWord[]
  onChange: (words: CorpusWord[]) => void
}

export function CorpusWordFields({ value, onChange }: CorpusWordFieldsProps) {
  const [bulkText, setBulkText] = useState('')
  const rows: WordRow[] =
    value.length > 0
      ? value.map((w) => ({ ja: w.ja, zh: w.zh, reading: w.reading ?? '' }))
      : [{ ja: '', zh: '', reading: '' }]

  const emit = (next: WordRow[]) => {
    onChange(
      next.map((r) => ({
        ja: r.ja,
        zh: r.zh,
        reading: r.reading.trim() || undefined,
      })),
    )
  }

  const updateRow = (index: number, field: keyof WordRow, text: string) => {
    emit(rows.map((row, i) => (i === index ? { ...row, [field]: text } : row)))
  }

  const addRow = () => emit([...rows, { ja: '', zh: '', reading: '' }])

  const removeRow = (index: number) => {
    const next = rows.filter((_, i) => i !== index)
    emit(next.length > 0 ? next : [{ ja: '', zh: '', reading: '' }])
  }

  const applyBulkPaste = () => {
    const trimmed = bulkText.trim()
    if (!trimmed) return
    const parsed = parseCorpusWordLines(trimmed)
    const invalid = countInvalidCorpusWordLines(trimmed)
    if (parsed.length === 0) {
      window.alert('未能识别单词，请使用「日语|中文」或「日语|中文|读音」格式，每行一条。')
      return
    }
    if (invalid > 0) {
      window.alert(`已导入 ${parsed.length} 条，有 ${invalid} 行格式无效已跳过。`)
    }
    onChange([
      ...value.filter((w) => w.ja.trim() && w.zh.trim()),
      ...parsed,
    ])
    setBulkText('')
  }

  return (
    <StructuredBlock
      label="常用单词"
      addLabel="＋ 添加单词"
      bulkHint="批量粘贴（每行：日语|中文|读音可选，支持全角｜）"
      bulkPlaceholder="コーヒー|咖啡|こーひー"
      bulkText={bulkText}
      onBulkTextChange={setBulkText}
      onBulkApply={applyBulkPaste}
      onAdd={addRow}
    >
      {rows.map((row, index) => (
        <div
          key={index}
          className="grid grid-cols-1 gap-2 rounded-lg border border-card-border bg-white p-2 sm:grid-cols-[1fr_1fr_1fr_auto]"
        >
          <input
            value={row.ja}
            onChange={(e) => updateRow(index, 'ja', e.target.value)}
            placeholder="日语"
            className="rounded-lg border border-card-border px-3 py-2 text-sm"
          />
          <input
            value={row.zh}
            onChange={(e) => updateRow(index, 'zh', e.target.value)}
            placeholder="中文"
            className="rounded-lg border border-card-border px-3 py-2 text-sm"
          />
          <input
            value={row.reading}
            onChange={(e) => updateRow(index, 'reading', e.target.value)}
            placeholder="读音（可选）"
            className="rounded-lg border border-card-border px-3 py-2 text-sm"
          />
          <RemoveButton
            onClick={() => removeRow(index)}
            disabled={rows.length === 1 && !row.ja && !row.zh && !row.reading}
          />
        </div>
      ))}
    </StructuredBlock>
  )
}

interface CorpusPhraseFieldsProps {
  value: CorpusPhrase[]
  onChange: (phrases: CorpusPhrase[]) => void
}

export function CorpusPhraseFields({ value, onChange }: CorpusPhraseFieldsProps) {
  const [bulkText, setBulkText] = useState('')
  const rows: PhraseRow[] =
    value.length > 0
      ? value.map((p) => ({ ja: p.ja, zh: p.zh, note: p.note ?? '' }))
      : [{ ja: '', zh: '', note: '' }]

  const emit = (next: PhraseRow[]) => {
    onChange(
      next.map((r) => ({
        ja: r.ja,
        zh: r.zh,
        note: r.note.trim() || undefined,
      })),
    )
  }

  const updateRow = (index: number, field: keyof PhraseRow, text: string) => {
    emit(rows.map((row, i) => (i === index ? { ...row, [field]: text } : row)))
  }

  const addRow = () => emit([...rows, { ja: '', zh: '', note: '' }])

  const removeRow = (index: number) => {
    const next = rows.filter((_, i) => i !== index)
    emit(next.length > 0 ? next : [{ ja: '', zh: '', note: '' }])
  }

  const applyBulkPaste = () => {
    const trimmed = bulkText.trim()
    if (!trimmed) return
    const parsed = parseCorpusPhraseLines(trimmed)
    const invalid = countInvalidCorpusPhraseLines(trimmed)
    if (parsed.length === 0) {
      window.alert('未能识别句式，请使用「日语|中文」或「日语|中文|备注」格式，每行一条。')
      return
    }
    if (invalid > 0) {
      window.alert(`已导入 ${parsed.length} 条，有 ${invalid} 行格式无效已跳过。`)
    }
    onChange([
      ...value.filter((p) => p.ja.trim() && p.zh.trim()),
      ...parsed,
    ])
    setBulkText('')
  }

  return (
    <StructuredBlock
      label="常用句式（例句）"
      addLabel="＋ 添加句式"
      bulkHint="批量粘贴（每行：日语|中文|备注可选，支持全角｜）"
      bulkPlaceholder="これください|请给我这个"
      bulkText={bulkText}
      onBulkTextChange={setBulkText}
      onBulkApply={applyBulkPaste}
      onAdd={addRow}
    >
      {rows.map((row, index) => (
        <div
          key={index}
          className="grid grid-cols-1 gap-2 rounded-lg border border-card-border bg-white p-2 sm:grid-cols-[1fr_1fr_1fr_auto]"
        >
          <input
            value={row.ja}
            onChange={(e) => updateRow(index, 'ja', e.target.value)}
            placeholder="日语句式"
            className="rounded-lg border border-card-border px-3 py-2 text-sm"
          />
          <input
            value={row.zh}
            onChange={(e) => updateRow(index, 'zh', e.target.value)}
            placeholder="中文"
            className="rounded-lg border border-card-border px-3 py-2 text-sm"
          />
          <input
            value={row.note}
            onChange={(e) => updateRow(index, 'note', e.target.value)}
            placeholder="备注（可选）"
            className="rounded-lg border border-card-border px-3 py-2 text-sm"
          />
          <RemoveButton
            onClick={() => removeRow(index)}
            disabled={rows.length === 1 && !row.ja && !row.zh && !row.note}
          />
        </div>
      ))}
    </StructuredBlock>
  )
}

function StructuredBlock({
  label,
  addLabel,
  bulkHint,
  bulkPlaceholder,
  bulkText,
  onBulkTextChange,
  onBulkApply,
  onAdd,
  children,
}: {
  label: string
  addLabel: string
  bulkHint: string
  bulkPlaceholder: string
  bulkText: string
  onBulkTextChange: (v: string) => void
  onBulkApply: () => void
  onAdd: () => void
  children: ReactNode
}) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm text-sumi-muted">{label}</span>
      <div className="space-y-2">{children}</div>
      <button
        type="button"
        onClick={onAdd}
        className="self-start rounded-lg border border-dashed border-indigo-ja/40 px-3 py-1.5 text-sm text-indigo-ja-dark hover:bg-indigo-ja/5"
      >
        {addLabel}
      </button>
      <div className="mt-1 flex flex-col gap-1">
        <span className="text-xs text-sumi-muted">{bulkHint}</span>
        <textarea
          value={bulkText}
          onChange={(e) => onBulkTextChange(e.target.value)}
          rows={2}
          placeholder={bulkPlaceholder}
          className="rounded-lg border border-card-border bg-white px-3 py-2 text-sm"
        />
        <button
          type="button"
          onClick={onBulkApply}
          disabled={!bulkText.trim()}
          className="self-start rounded border border-card-border px-2 py-1 text-xs text-indigo-ja-dark hover:bg-washi disabled:opacity-40"
        >
          导入到列表
        </button>
      </div>
    </div>
  )
}

function RemoveButton({ onClick, disabled }: { onClick: () => void; disabled: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="rounded border border-card-border px-2 py-1 text-xs text-sumi-muted hover:bg-washi disabled:opacity-40"
      aria-label="删除"
    >
      删除
    </button>
  )
}
