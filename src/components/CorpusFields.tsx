import { useState, type DragEvent, type ReactNode } from 'react'
import {
  countInvalidCorpusPhraseLines,
  countInvalidCorpusWordLines,
  parseCorpusPhraseLines,
  parseCorpusWordLines,
} from '../lib/parse-card-fields'
import type { CorpusPhrase, CorpusWord } from '../lib/types'

type WordRow = { ja: string; zh: string; reading: string }
type PhraseRow = { ja: string; zh: string; note: string }

function reorderByIndex<T>(items: T[], from: number, to: number): T[] {
  if (from === to || from < 0 || to < 0 || from >= items.length || to >= items.length) {
    return items
  }
  const next = [...items]
  const [item] = next.splice(from, 1)
  next.splice(to, 0, item)
  return next
}

function useDragReorder<T>(items: T[], onReorder: (next: T[]) => void) {
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)

  const handleDragStart = (index: number, e: DragEvent) => {
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', String(index))
    setDraggingIndex(index)
  }

  const handleDragEnd = () => {
    setDraggingIndex(null)
    setDragOverIndex(null)
  }

  const handleDragOver = (index: number, e: DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    if (draggingIndex !== null && draggingIndex !== index) {
      setDragOverIndex(index)
    }
  }

  const handleDragLeave = (index: number, e: DragEvent) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setDragOverIndex((prev) => (prev === index ? null : prev))
    }
  }

  const handleDrop = (index: number, e: DragEvent) => {
    e.preventDefault()
    const from = Number(e.dataTransfer.getData('text/plain'))
    if (!Number.isNaN(from) && from !== index) {
      onReorder(reorderByIndex(items, from, index))
    }
    handleDragEnd()
  }

  return {
    draggingIndex,
    dragOverIndex,
    handleDragStart,
    handleDragEnd,
    handleDragOver,
    handleDragLeave,
    handleDrop,
  }
}

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

  const drag = useDragReorder(rows, emit)

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
      orderHint="拖动左侧手柄调整整行顺序"
      addLabel="＋ 添加单词"
      bulkHint="批量粘贴（每行：日语|中文|读音可选，支持全角｜）"
      bulkPlaceholder="コーヒー|咖啡|こーひー"
      bulkText={bulkText}
      onBulkTextChange={setBulkText}
      onBulkApply={applyBulkPaste}
      onAdd={addRow}
    >
      <CorpusTable
        columns={['', '日语', '中文', '读音（可选）', '操作']}
        rowCount={rows.length}
      >
        {rows.map((row, index) => (
          <DraggableTableRow key={index} index={index} drag={drag}>
            <TableCell className="w-10">
              <DragHandle
                index={index}
                onDragStart={drag.handleDragStart}
                onDragEnd={drag.handleDragEnd}
              />
            </TableCell>
            <TableCell>
              <input
                value={row.ja}
                onChange={(e) => updateRow(index, 'ja', e.target.value)}
                placeholder="日语"
                className={inputClass}
              />
            </TableCell>
            <TableCell>
              <input
                value={row.zh}
                onChange={(e) => updateRow(index, 'zh', e.target.value)}
                placeholder="中文"
                className={inputClass}
              />
            </TableCell>
            <TableCell>
              <input
                value={row.reading}
                onChange={(e) => updateRow(index, 'reading', e.target.value)}
                placeholder="读音"
                className={inputClass}
              />
            </TableCell>
            <TableCell className="w-16">
              <RemoveButton
                onClick={() => removeRow(index)}
                disabled={rows.length === 1 && !row.ja && !row.zh && !row.reading}
              />
            </TableCell>
          </DraggableTableRow>
        ))}
      </CorpusTable>
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

  const drag = useDragReorder(rows, emit)

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
      orderHint="拖动左侧手柄调整整行顺序"
      addLabel="＋ 添加句式"
      bulkHint="批量粘贴（每行：日语|中文|备注可选，支持全角｜）"
      bulkPlaceholder="これください|请给我这个"
      bulkText={bulkText}
      onBulkTextChange={setBulkText}
      onBulkApply={applyBulkPaste}
      onAdd={addRow}
    >
      <CorpusTable
        columns={['', '日语句式', '中文', '备注（可选）', '操作']}
        rowCount={rows.length}
      >
        {rows.map((row, index) => (
          <DraggableTableRow key={index} index={index} drag={drag}>
            <TableCell className="w-10">
              <DragHandle
                index={index}
                onDragStart={drag.handleDragStart}
                onDragEnd={drag.handleDragEnd}
              />
            </TableCell>
            <TableCell>
              <input
                value={row.ja}
                onChange={(e) => updateRow(index, 'ja', e.target.value)}
                placeholder="日语句式"
                className={inputClass}
              />
            </TableCell>
            <TableCell>
              <input
                value={row.zh}
                onChange={(e) => updateRow(index, 'zh', e.target.value)}
                placeholder="中文"
                className={inputClass}
              />
            </TableCell>
            <TableCell>
              <input
                value={row.note}
                onChange={(e) => updateRow(index, 'note', e.target.value)}
                placeholder="备注"
                className={inputClass}
              />
            </TableCell>
            <TableCell className="w-16">
              <RemoveButton
                onClick={() => removeRow(index)}
                disabled={rows.length === 1 && !row.ja && !row.zh && !row.note}
              />
            </TableCell>
          </DraggableTableRow>
        ))}
      </CorpusTable>
    </StructuredBlock>
  )
}

const inputClass =
  'w-full min-w-0 rounded-lg border border-card-border bg-white px-3 py-2 text-sm'

function CorpusTable({
  columns,
  rowCount,
  children,
}: {
  columns: string[]
  rowCount: number
  children: ReactNode
}) {
  return (
    <div className="overflow-x-auto rounded-lg border border-card-border bg-white">
      <table className="w-full min-w-[36rem] border-collapse text-sm">
        <thead>
          <tr className="bg-washi/80 text-left text-xs text-sumi-muted">
            {columns.map((column) => (
              <th key={column} className="px-2 py-2 font-medium">
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rowCount === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-2 py-3 text-center text-sumi-muted">
                暂无内容
              </td>
            </tr>
          ) : (
            children
          )}
        </tbody>
      </table>
    </div>
  )
}

function TableCell({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  return <td className={`px-2 py-2 align-top ${className}`}>{children}</td>
}

type DragReorderHandlers = ReturnType<typeof useDragReorder<unknown>>

function DraggableTableRow({
  index,
  drag,
  children,
}: {
  index: number
  drag: DragReorderHandlers
  children: ReactNode
}) {
  const isDragging = drag.draggingIndex === index
  const isDragOver = drag.dragOverIndex === index && drag.draggingIndex !== index

  return (
    <tr
      onDragOver={(e) => drag.handleDragOver(index, e)}
      onDragLeave={(e) => drag.handleDragLeave(index, e)}
      onDrop={(e) => drag.handleDrop(index, e)}
      className={`border-t border-card-border/70 transition-colors ${
        isDragOver ? 'bg-indigo-ja/5' : isDragging ? 'opacity-50' : ''
      }`}
    >
      {children}
    </tr>
  )
}

function DragHandle({
  index,
  onDragStart,
  onDragEnd,
}: {
  index: number
  onDragStart: (index: number, e: DragEvent) => void
  onDragEnd: () => void
}) {
  return (
    <span
      draggable
      onDragStart={(e) => onDragStart(index, e)}
      onDragEnd={onDragEnd}
      className="inline-flex cursor-grab select-none rounded px-1 py-2 text-sumi-muted active:cursor-grabbing hover:bg-washi"
      title="拖动调整整行顺序"
      aria-label="拖动调整整行顺序"
    >
      ☰
    </span>
  )
}

function RemoveButton({ onClick, disabled }: { onClick: () => void; disabled: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="rounded border border-card-border px-2 py-1 text-xs text-sumi-muted hover:bg-washi disabled:opacity-40"
      aria-label="删除此行"
    >
      删除
    </button>
  )
}

function StructuredBlock({
  label,
  orderHint,
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
  orderHint: string
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
      <div>
        <span className="text-sm text-sumi-muted">{label}</span>
        <p className="mt-0.5 text-xs text-sumi-muted">{orderHint}</p>
      </div>
      {children}
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
