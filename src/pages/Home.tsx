import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getStats } from '../lib/db'
import { seedSampleData } from '../lib/seed'
import { CARD_TYPE_LABELS, type CardType } from '../lib/types'

export function Home() {
  const [stats, setStats] = useState<{
    totalCards: number
    dueCount: number
    byType: Record<string, number>
  } | null>(null)

  useEffect(() => {
    void seedSampleData().then(() => getStats().then(setStats))
  }, [])

  if (!stats) {
    return <p className="text-center text-sumi-muted">加载中…</p>
  }

  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-2xl border border-card-border bg-gradient-to-br from-sakura/20 via-white to-matcha/10 p-6 shadow-sm">
        <h1 className="text-xl font-medium text-sumi">今日学习</h1>
        <p className="mt-2 text-4xl font-light text-indigo-ja-dark">{stats.dueCount}</p>
        <p className="text-sm text-sumi-muted">张待复习</p>
        {stats.dueCount > 0 ? (
          <Link
            to="/study"
            className="mt-4 inline-block w-full rounded-xl bg-indigo-ja-dark py-3 text-center text-white no-underline transition-colors hover:bg-indigo-ja"
          >
            开始复习
          </Link>
        ) : (
          <p className="mt-4 text-sm text-sumi-muted">
            {stats.totalCards === 0
              ? '还没有卡片，先去新建一张吧'
              : '今日暂无待复习，可以预习新卡'}
          </p>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-sm font-medium text-sumi-muted">按类型复习</h2>
        <div className="grid gap-3">
          {(['vocabulary', 'grammar', 'corpus', 'contrast'] as CardType[]).map((type) => (
            <Link
              key={type}
              to={`/study?type=${type}`}
              className="flex items-center justify-between rounded-xl border border-card-border bg-white px-4 py-3 no-underline hover:shadow-sm"
            >
              <span className="text-sumi">{CARD_TYPE_LABELS[type]}</span>
              <span className="text-sm text-sumi-muted">{stats.byType[type] ?? 0} 张</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-dashed border-card-border p-4 text-center">
        <p className="text-sm text-sumi-muted">共 {stats.totalCards} 张闪卡</p>
        <Link to="/cards/new" className="mt-2 inline-block text-sm text-indigo-ja-dark no-underline hover:underline">
          ＋ 新建闪卡
        </Link>
      </section>
    </div>
  )
}
