import { useEffect } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { useChrome } from '@/chrome/ChromeContext'

/** 顶部导航栏：浏览型页面显示；答题流程通过 ChromeContext 关闭，路由变化时自动复位 */
export default function NavBar() {
  const { navHidden, setNavHidden } = useChrome()
  const { pathname } = useLocation()

  /* 路由变化强制复位，防止从答题页浏览器后退后导航栏残留消失 */
  useEffect(() => {
    setNavHidden(false)
  }, [pathname, setNavHidden])

  if (navHidden) return null

  return (
    <header className="sticky top-0 z-40 border-b border-foreground/10 bg-white/85 backdrop-blur">
      <nav className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <Link to="/" className="flex items-center">
          {/* BASE_URL：GitHub Pages 部署在仓库子路径下（如 /cs_ashore/），本地与自定义域名下为 / */}
          <img
            src={`${import.meta.env.BASE_URL}forashore-logo.svg`}
            alt="ForAshore"
            className="h-7"
          />
        </Link>
        <div className="flex items-center gap-1 sm:gap-2">
          <NavTab to="/guide" label="指南" />
          <NavTab to="/tools" label="工具" />
        </div>
      </nav>
    </header>
  )
}

function NavTab({ to, label }: { to: string; label: string }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `relative rounded-lg px-3 py-1.5 text-sm transition-colors ${
          isActive ? 'font-bold text-accent' : 'text-foreground/60 hover:text-foreground'
        }`
      }
    >
      {({ isActive }) => (
        <>
          {label}
          {isActive && <span className="absolute inset-x-3 -bottom-[7px] h-0.5 rounded-full bg-accent" />}
        </>
      )}
    </NavLink>
  )
}
