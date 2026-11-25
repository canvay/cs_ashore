import { createContext, useContext, useState, type ReactNode } from 'react'

/**
 * 页面外壳（导航栏等）与内容页之间的约定。
 * 黑话挑战的答题流程（categories/game/result）需要全屏专注，通过 setNavHidden 关闭顶部导航栏；
 * NavBar 会在路由变化时强制复位，防止浏览器后退后导航栏残留消失。
 */
interface Chrome {
  navHidden: boolean
  setNavHidden: (v: boolean) => void
}

const ChromeContext = createContext<Chrome>({ navHidden: false, setNavHidden: () => {} })

export function ChromeProvider({ children }: { children: ReactNode }) {
  const [navHidden, setNavHidden] = useState(false)
  return <ChromeContext.Provider value={{ navHidden, setNavHidden }}>{children}</ChromeContext.Provider>
}

export function useChrome() {
  return useContext(ChromeContext)
}
