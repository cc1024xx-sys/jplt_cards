import { useRef, useState } from 'react'
import { exportBackup, downloadBackup, importBackupFromFile, getLastExportAt } from '../lib/backup'

export function Settings() {
  const fileRef = useRef<HTMLInputElement>(null)
  const [message, setMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)
  const lastExport = getLastExportAt()

  const handleExport = async () => {
    try {
      const data = await exportBackup()
      downloadBackup(data)
      setMessage({ type: 'ok', text: `已导出 ${data.decks.length} 个牌组、${data.cards.length} 张卡片` })
    } catch {
      setMessage({ type: 'err', text: '导出失败' })
    }
  }

  const handleImport = async (file: File) => {
    if (
      !confirm(
        '导入将替换本机全部学习内容。建议先导出当前备份。确定继续？',
      )
    ) {
      return
    }
    try {
      const { deckCount, cardCount } = await importBackupFromFile(file)
      setMessage({
        type: 'ok',
        text: `已恢复 ${deckCount} 个牌组、${cardCount} 张卡片，请刷新页面`,
      })
      setTimeout(() => window.location.href = '/', 1500)
    } catch (e) {
      setMessage({
        type: 'err',
        text: e instanceof Error ? e.message : '导入失败',
      })
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-medium">设置</h1>

      <section className="rounded-xl border border-card-border bg-white p-4">
        <h2 className="font-medium text-sumi">内容备份</h2>
        <p className="mt-1 text-sm text-sumi-muted">
          数据保存在本机浏览器。换设备或清缓存前请导出备份。
        </p>
        {lastExport && (
          <p className="mt-2 text-xs text-sumi-muted">
            上次导出：{new Date(lastExport).toLocaleString('zh-CN')}
          </p>
        )}

        <div className="mt-4 flex flex-col gap-2">
          <button
            type="button"
            onClick={handleExport}
            className="rounded-lg bg-indigo-ja-dark py-2.5 text-white hover:bg-indigo-ja"
          >
            导出备份（JSON）
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".json,application/json"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) void handleImport(f)
              e.target.value = ''
            }}
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="rounded-lg border border-card-border py-2.5 hover:bg-washi"
          >
            导入备份（覆盖本机数据）
          </button>
        </div>
      </section>

      {message && (
        <p
          className={`rounded-lg px-3 py-2 text-sm ${
            message.type === 'ok'
              ? 'bg-matcha/15 text-matcha-deep'
              : 'bg-unfamiliar/15 text-sakura-deep'
          }`}
        >
          {message.text}
        </p>
      )}

      <section className="text-sm text-sumi-muted">
        <p>日语闪卡 Web MVP</p>
        <p className="mt-1">词语 · 语法 · 语料库 · 熟悉度复习</p>
      </section>
    </div>
  )
}
