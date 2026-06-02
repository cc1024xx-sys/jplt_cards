import { useCallback } from 'react'
import { exampleFromText, formatExampleText } from '../lib/example-text'
import type { ExamplePair } from '../lib/types'

interface ExampleFieldsProps {
  label: string
  value: ExamplePair[]
  onChange: (examples: ExamplePair[]) => void
}

function resizeTextarea(el: HTMLTextAreaElement) {
  el.style.height = 'auto'
  el.style.height = `${Math.max(el.scrollHeight, 72)}px`
}

export function ExampleFields({ label, value, onChange }: ExampleFieldsProps) {
  const rows = value.length > 0 ? value : [{ ja: '', zh: '' }]

  const setTextareaRef = useCallback((el: HTMLTextAreaElement | null) => {
    if (el) resizeTextarea(el)
  }, [])

  const updateRow = (index: number, text: string) => {
    const next = rows.map((row, i) => (i === index ? exampleFromText(text) : row))
    onChange(next)
  }

  const addRow = () => {
    onChange([...rows, exampleFromText('')])
  }

  const removeRow = (index: number) => {
    const next = rows.filter((_, i) => i !== index)
    onChange(next.length > 0 ? next : [exampleFromText('')])
  }

  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm text-sumi-muted">{label}</span>
      <p className="text-xs text-sumi-muted">支持换行（Enter），每框一条例句</p>
      <div className="space-y-2">
        {rows.map((row, index) => {
          const text = formatExampleText(row)
          return (
            <div
              key={index}
              className="flex gap-2 rounded-lg border border-card-border bg-white p-2"
            >
              <textarea
                ref={setTextareaRef}
                value={text}
                onChange={(e) => {
                  updateRow(index, e.target.value)
                  resizeTextarea(e.target)
                }}
                rows={3}
                placeholder="例句内容（可换行）"
                className="min-h-[4.5rem] min-w-0 flex-1 resize-y rounded-lg border border-card-border px-3 py-2 text-sm whitespace-pre-wrap"
              />
              <button
                type="button"
                onClick={() => removeRow(index)}
                disabled={rows.length === 1 && !text.trim()}
                className="shrink-0 self-start rounded border border-card-border px-2 py-1 text-xs text-sumi-muted hover:bg-washi disabled:opacity-40"
                aria-label="删除例句"
              >
                删除
              </button>
            </div>
          )
        })}
      </div>
      <button
        type="button"
        onClick={addRow}
        className="self-start rounded-lg border border-dashed border-indigo-ja/40 px-3 py-1.5 text-sm text-indigo-ja-dark hover:bg-indigo-ja/5"
      >
        ＋ 添加例句
      </button>
    </div>
  )
}
