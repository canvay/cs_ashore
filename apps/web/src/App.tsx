import { useEffect } from 'react'
import { HashRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { ChromeProvider } from '@/chrome/ChromeContext'
import NavBar from '@/components/NavBar'
import HomePage from '@/pages/HomePage'
import ToolsPage from '@/pages/ToolsPage'
import GuideListPage from '@/pages/guide/GuideListPage'
import GuideArticlePage from '@/pages/guide/GuideArticlePage'
import HeihuaModule from '@/pages/heihua/HeihuaModule'

/** 路由切换后回到页面顶部（HashRouter 无内置 ScrollRestoration） */
function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}

export default function App() {
  return (
    <ChromeProvider>
      <HashRouter>
        <ScrollToTop />
        <NavBar />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/guide" element={<GuideListPage />} />
          <Route path="/guide/:slug" element={<GuideArticlePage />} />
          <Route path="/tools" element={<ToolsPage />} />
          <Route path="/tools/heihua" element={<HeihuaModule />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </HashRouter>
    </ChromeProvider>
  )
}
