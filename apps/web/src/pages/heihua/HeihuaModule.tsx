import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useChrome } from '@/chrome/ChromeContext'
import { LS, BEST_KEY, DONE_KEY, SOUND_KEY, WRONG_KEY } from '@/lib/storage'
import {
  EMPTY_STATE,
  beep,
  buildQueue,
  makeOptions,
  readStats,
  type GameState,
  type Mode,
} from '@/lib/game'
import HeihuaHomeView from './HeihuaHomeView'
import CategoriesView from './CategoriesView'
import GameView from './GameView'
import ResultView from './ResultView'

/** 黑话挑战模块内部视图（quiz = 模块主页；其余为答题流程，不进 URL） */
type View = 'quiz' | 'categories' | 'game' | 'result'

export default function HeihuaModule() {
  const navigate = useNavigate()
  const { setNavHidden } = useChrome()
  const [view, setView] = useState<View>('quiz')
  const [g, setG] = useState<GameState>(EMPTY_STATE)
  const [soundOn, setSoundOn] = useState<boolean>(() => LS.get(SOUND_KEY, true))
  const [stats, setStats] = useState(readStats)

  const gRef = useRef(g)
  gRef.current = g
  const lockRef = useRef(false) // 当前题是否已作答（比 state 更早生效，防连点）
  const answerRef = useRef<(i: number) => void>(() => {})
  const nextRef = useRef<() => void>(() => {})

  /* 答题流程（categories/game/result）隐藏顶部导航栏；离开模块时复位 */
  useEffect(() => {
    setNavHidden(view !== 'quiz')
    return () => setNavHidden(false)
  }, [view, setNavHidden])

  /* 回到工具板块，顺带刷新统计 */
  const goPortal = useCallback(() => {
    setStats(readStats())
    navigate('/tools')
  }, [navigate])

  /* 模块内返回（游戏退出/分类返回/结果页）都回到模块主页 */
  const goHome = useCallback(() => {
    setStats(readStats())
    setView('quiz')
  }, [])

  const finish = useCallback(() => {
    const cur = gRef.current
    const best = LS.get(BEST_KEY, 0)
    if (cur.score > best) LS.set(BEST_KEY, cur.score)
    setStats(readStats())
    setView('result')
  }, [])

  const startGame = useCallback((mode: Mode, category = '') => {
    const queue = buildQueue(mode, category)
    if (!queue) {
      alert('错题本还是空的，先去闯关攒几道错题吧。')
      return
    }
    const first = queue[0]
    lockRef.current = false
    setG({ ...EMPTY_STATE, mode, category, queue, current: first, options: makeOptions(first.a) })
    setView('game')
  }, [])

  const answer = useCallback((i: number) => {
    const cur = gRef.current
    if (lockRef.current || !cur.current) return
    const q = cur.current
    const ok = cur.options[i] === q.a
    lockRef.current = true

    LS.set(DONE_KEY, LS.get(DONE_KEY, 0) + 1)
    let wrongIds = LS.get(WRONG_KEY, [] as number[])
    if (ok) wrongIds = wrongIds.filter((x) => x !== q.id)
    else if (!wrongIds.includes(q.id)) wrongIds.push(q.id)
    LS.set(WRONG_KEY, wrongIds)
    if (LS.get(SOUND_KEY, true)) beep(ok)

    const newCombo = ok ? cur.combo + 1 : 0
    setG((prev) => ({
      ...prev,
      locked: true,
      picked: i,
      score: prev.score + (ok ? 10 + Math.min(prev.combo, 5) * 2 : 0),
      combo: newCombo,
      maxCombo: Math.max(prev.maxCombo, newCombo),
      correct: prev.correct + (ok ? 1 : 0),
      wrong: prev.wrong + (ok ? 0 : 1),
      mistakes: ok ? prev.mistakes : [...prev.mistakes, q],
    }))
  }, [])
  answerRef.current = answer

  const next = useCallback(() => {
    const cur = gRef.current
    if (!cur.current) return
    const ni = cur.idx + 1
    if (cur.mode !== 'speed' && ni >= cur.queue.length) {
      finish()
      return
    }
    const q = cur.queue[ni % cur.queue.length]
    lockRef.current = false
    setG((prev) => ({ ...prev, idx: ni, locked: false, picked: -1, current: q, options: makeOptions(q.a) }))
  }, [finish])
  nextRef.current = next

  /* 60 秒速答：计时器 */
  useEffect(() => {
    if (view !== 'game' || g.mode !== 'speed') return
    const t = setInterval(() => {
      const cur = gRef.current
      if (cur.left <= 1) {
        clearInterval(t)
        finish()
        return
      }
      setG((prev) => ({ ...prev, left: prev.left - 1 }))
    }, 1000)
    return () => clearInterval(t)
  }, [view, g.mode, finish])

  /* 60 秒速答：作答后 750ms 自动进入下一题（与原版一致） */
  useEffect(() => {
    if (view === 'game' && g.mode === 'speed' && g.locked) {
      const t = setTimeout(() => nextRef.current(), 750)
      return () => clearTimeout(t)
    }
  }, [view, g.mode, g.locked, g.idx])

  /* 键盘快捷键：1-4 选项，Enter 下一题（原版 Enter 判断条件写反导致失效，此处修正） */
  useEffect(() => {
    if (view !== 'game') return
    const onKey = (e: KeyboardEvent) => {
      if (['1', '2', '3', '4'].includes(e.key)) {
        answerRef.current(Number(e.key) - 1)
      } else if (e.key === 'Enter' && lockRef.current) {
        nextRef.current()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [view])

  /* ---------- 渲染 ---------- */
  if (view === 'categories') {
    return <CategoriesView onBack={goHome} onStart={(c) => startGame('category', c)} />
  }

  if (view === 'game') {
    return <GameView g={g} onBack={goHome} onAnswer={answer} onNext={next} />
  }

  if (view === 'result') {
    return (
      <ResultView
        g={g}
        onRestart={() => startGame(g.mode, g.category)}
        onHome={goHome}
      />
    )
  }

  return (
    <HeihuaHomeView
      stats={stats}
      soundOn={soundOn}
      onToggleSound={() => {
        setSoundOn(!soundOn)
        LS.set(SOUND_KEY, !soundOn)
      }}
      onBack={goPortal}
      onSelectMode={(mode) => (mode === 'category' ? setView('categories') : startGame(mode))}
    />
  )
}
