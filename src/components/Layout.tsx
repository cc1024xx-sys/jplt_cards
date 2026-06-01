import { Link, Outlet, useLocation } from 'react-router-dom'

const navItems = [
  { to: '/', label: '首页', icon: '⌂' },
  { to: '/decks', label: '牌组', icon: '▤' },
  { to: '/cards/new', label: '新建', icon: '＋' },
  { to: '/settings', label: '设置', icon: '⚙' },
]

export function Layout() {
  const location = useLocation()

  return (
    <div className="flex min-h-full flex-col">
      <header className="border-b border-card-border bg-washi/90 px-4 py-3 backdrop-blur-sm">
        <div className="mx-auto flex max-w-2xl items-center justify-between">
          <Link to="/" className="flex items-center gap-2 no-underline">
            <span className="text-xl text-sakura-deep" aria-hidden>
              桜
            </span>
            <span className="text-lg font-medium tracking-wide text-sumi">
              日语闪卡
            </span>
          </Link>
          <span className="text-xs text-sumi-muted">学单词 · 语法 · 口语</span>
        </div>
      </header>

      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-6">
        <Outlet />
      </main>

      <nav className="sticky bottom-0 border-t border-card-border bg-washi-dark/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-2xl justify-around py-2">
          {navItems.map((item) => {
            const active =
              item.to === '/'
                ? location.pathname === '/'
                : location.pathname.startsWith(item.to)
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex flex-col items-center gap-0.5 px-3 py-1 text-xs no-underline transition-colors ${
                  active
                    ? 'text-indigo-ja-dark font-medium'
                    : 'text-sumi-muted hover:text-indigo-ja'
                }`}
              >
                <span className="text-lg leading-none">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
