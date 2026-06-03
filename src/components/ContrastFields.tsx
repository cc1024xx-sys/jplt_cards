import type { ContrastEntry } from '../lib/types'
import { ExampleFields } from './ExampleFields'

export const emptyContrastEntry = (): ContrastEntry => ({
  label: '',
  examples: [{ ja: '', zh: '' }],
})

function ContrastEntryFields({
  index,
  value,
  onChange,
  onRemove,
  canRemove,
}: {
  index: number
  value: ContrastEntry
  onChange: (entry: ContrastEntry) => void
  onRemove: () => void
  canRemove: boolean
}) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-card-border bg-washi/40 p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium text-indigo-ja-dark">对比项 {index}</p>
        {canRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="text-xs text-sakura-deep hover:underline"
          >
            删除
          </button>
        )}
      </div>
      <label className="flex flex-col gap-1">
        <span className="text-xs text-sumi-muted">语法或固定搭配</span>
        <input
          value={value.label}
          onChange={(e) => onChange({ ...value, label: e.target.value })}
          placeholder="如：のに"
          required
          className="rounded-lg border border-card-border bg-white px-3 py-2"
        />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-xs text-sumi-muted">补充说明（可选）</span>
        <input
          value={value.subtitle ?? ''}
          onChange={(e) =>
            onChange({ ...value, subtitle: e.target.value.trim() || undefined })
          }
          className="rounded-lg border border-card-border bg-white px-3 py-2 text-sm"
        />
      </label>
      <ExampleFields
        label="例句"
        value={value.examples}
        onChange={(examples) => onChange({ ...value, examples })}
      />
    </div>
  )
}

export function ContrastFormFields({
  title,
  onTitleChange,
  prompt,
  onPromptChange,
  items,
  onItemsChange,
  pitfallsText,
  onPitfallsTextChange,
}: {
  title: string
  onTitleChange: (v: string) => void
  prompt: string
  onPromptChange: (v: string) => void
  items: ContrastEntry[]
  onItemsChange: (items: ContrastEntry[]) => void
  pitfallsText: string
  onPitfallsTextChange: (v: string) => void
}) {
  const updateItem = (index: number, entry: ContrastEntry) => {
    onItemsChange(items.map((item, i) => (i === index ? entry : item)))
  }

  const removeItem = (index: number) => {
    if (items.length <= 2) return
    onItemsChange(items.filter((_, i) => i !== index))
  }

  const addItem = () => {
    if (items.length >= 6) return
    onItemsChange([...items, emptyContrastEntry()])
  }

  return (
    <>
      <label className="flex flex-col gap-1">
        <span className="text-sm text-sumi-muted">辨析主题（正面）</span>
        <input
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          required
          placeholder="如：のに vs なのに"
          className="rounded-lg border border-card-border bg-white px-3 py-2"
        />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-sm text-sumi-muted">提示语（正面，可选）</span>
        <input
          value={prompt}
          onChange={(e) => onPromptChange(e.target.value)}
          placeholder="如：两者都表示转折，有何区别？"
          className="rounded-lg border border-card-border bg-white px-3 py-2"
        />
      </label>
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm text-sumi-muted">背面 · 对比项（至少 2 项）</span>
          {items.length < 6 && (
            <button
              type="button"
              onClick={addItem}
              className="text-xs text-indigo-ja-dark hover:underline"
            >
              ＋ 添加对比项
            </button>
          )}
        </div>
        {items.map((item, i) => (
          <ContrastEntryFields
            key={i}
            index={i + 1}
            value={item}
            onChange={(entry) => updateItem(i, entry)}
            onRemove={() => removeItem(i)}
            canRemove={items.length > 2}
          />
        ))}
      </div>
      <label className="flex flex-col gap-1">
        <span className="text-sm text-sumi-muted">易混点（每行一条，可选）</span>
        <textarea
          value={pitfallsText}
          onChange={(e) => onPitfallsTextChange(e.target.value)}
          rows={3}
          placeholder="常见误用或记忆要点"
          className="rounded-lg border border-card-border bg-white px-3 py-2"
        />
      </label>
    </>
  )
}
