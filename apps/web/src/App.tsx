import { useCallback, useEffect, useRef, useState } from 'react'
import { ArrowLeft, ArrowRight, Volume2, VolumeX } from 'lucide-react'
import { Button, Chip, ProgressBar } from '@heroui/react'
import {
  ALL_ANSWERS,
  CATS,
  QUESTIONS,
  countByCat,
  type HeihuaEntry,
} from '@cs/heihua-data'

type Mode = 'normal' | 'speed' | 'category' | 'wrong'
/** home = 模块首页（portal），quiz = 黑话挑战模块主页 */
type View = 'home' | 'quiz' | 'categories' | 'game' | 'result'

/** 模块注册表：后续新增模块在这里加一条，并在 App 里加对应视图与入口跳转 */
const MODULES = [
  {
    key: 'quiz',
    title: '黑话挑战',
  },
] as const

/* ---------- 本地存储 ---------- */
const LS = {
  get<T>(key: string, fallback: T): T {
    try {
      const raw = localStorage.getItem(key)
      return raw === null ? fallback : (JSON.parse(raw) as T)
    } catch {
      return fallback
    }
  },
  set(key: string, value: unknown) {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch {
      /* ignore */
    }
  },
}
const BEST_KEY = 'shenlun_best'
const DONE_KEY = 'shenlun_done'
const WRONG_KEY = 'shenlun_wrong'
const SOUND_KEY = 'shenlun_sound'

/* ---------- 工具 ---------- */
function shuffle<T>(arr: readonly T[]): T[] {
  const a = arr.slice()
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/** 干扰项优先取与正确答案长度接近的表述，迷惑性更强（与原版一致） */
function makeOptions(answer: string): string[] {
  const pool = ALL_ANSWERS.filter((a) => a !== answer)
  pool.sort((a, b) => Math.abs(a.length - answer.length) - Math.abs(b.length - answer.length))
  const distract = shuffle(pool.slice(0, 28)).slice(0, 3)
  return shuffle([answer, ...distract])
}

function beep(ok: boolean) {
  try {
    const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.type = 'sine'
    osc.frequency.setValueAtTime(ok ? 760 : 240, ctx.currentTime)
    if (ok) osc.frequency.exponentialRampToValueAtTime(1180, ctx.currentTime + 0.1)
    gain.gain.setValueAtTime(0.1, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.17)
    osc.start()
    osc.stop(ctx.currentTime + 0.18)
    osc.onended = () => ctx.close()
  } catch {
    /* ignore */
  }
}

/* ---------- 游戏状态 ---------- */
interface GameState {
  mode: Mode
  category: string
  queue: HeihuaEntry[]
  idx: number
  score: number
  combo: number
  maxCombo: number
  correct: number
  wrong: number
  mistakes: HeihuaEntry[]
  locked: boolean
  picked: number
  left: number
  current: HeihuaEntry | null
  options: string[]
}

const EMPTY_STATE: GameState = {
  mode: 'normal',
  category: '',
  queue: [],
  idx: 0,
  score: 0,
  combo: 0,
  maxCombo: 0,
  correct: 0,
  wrong: 0,
  mistakes: [],
  locked: false,
  picked: -1,
  left: 60,
  current: null,
  options: [],
}

function readStats() {
  return {
    best: LS.get(BEST_KEY, 0),
    done: LS.get(DONE_KEY, 0),
    wrong: LS.get(WRONG_KEY, [] as number[]).length,
  }
}

const MODE_LABELS: Record<Mode, string> = {
  normal: '闯关答题',
  speed: '60秒速答',
  category: '分类专练',
  wrong: '错题重做',
}

/* ---------- 组件 ---------- */
export default function App() {
  const [view, setView] = useState<View>('home')
  const [g, setG] = useState<GameState>(EMPTY_STATE)
  const [soundOn, setSoundOn] = useState<boolean>(() => LS.get(SOUND_KEY, true))
  const [stats, setStats] = useState(readStats)

  const gRef = useRef(g)
  gRef.current = g
  const lockRef = useRef(false) // 当前题是否已作答（比 state 更早生效，防连点）
  const answerRef = useRef<(i: number) => void>(() => {})
  const nextRef = useRef<() => void>(() => {})

  /* 回到模块首页（portal），顺带刷新统计 */
  const goPortal = useCallback(() => {
    setStats(readStats())
    setView('home')
  }, [])

  /* 进入黑话挑战模块主页 */
  const goQuiz = useCallback(() => {
    setStats(readStats())
    setView('quiz')
  }, [])

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
    let queue: HeihuaEntry[]
    if (mode === 'speed') {
      queue = shuffle(QUESTIONS)
    } else if (mode === 'category') {
      queue = shuffle(QUESTIONS.filter((q) => q.c === category))
    } else if (mode === 'wrong') {
      const ids = LS.get(WRONG_KEY, [] as number[])
      queue = shuffle(QUESTIONS.filter((q) => ids.includes(q.id)))
      if (!queue.length) {
        alert('错题本还是空的，先去闯关攒几道错题吧。')
        return
      }
    } else {
      queue = shuffle(QUESTIONS).slice(0, 20)
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
  if (view === 'home') {
    return (
      <div className="mx-auto flex min-h-svh max-w-xl flex-col px-4 py-6 sm:py-10 md:max-w-3xl lg:max-w-5xl">
        <header className="flex items-center justify-between">
          <div className="flex items-center">
            {/* BASE_URL：GitHub Pages 部署在仓库子路径下（如 /cs_ashore/），本地与自定义域名下为 / */}
            <img
              src={`${import.meta.env.BASE_URL}forashore-logo.svg`}
              alt="ForAshore"
              className="h-8 sm:h-10"
            />
          </div>
        </header>

        <div className="py-12 text-center sm:py-16 md:py-20">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">选择一个模块开始</h1>
          <p className="mx-auto mt-3 max-w-sm text-sm leading-7 text-foreground/60">
            每个模块都是一个小工具，进度保存在本机。
          </p>
        </div>

        <p className="mb-3 text-xs font-medium tracking-widest text-foreground/50">模块列表</p>
        <div className="grid gap-3 sm:grid-cols-2">
          {MODULES.map((m) => (
            <div
              key={m.key}
              role="button"
              tabIndex={0}
              onClick={goQuiz}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') goQuiz()
              }}
              className="flex cursor-pointer items-center gap-4 rounded-2xl border border-accent/25 bg-accent/10 p-4 transition-all active:scale-[0.98]"
            >
              <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-accent text-lg font-bold text-accent-foreground">
                申
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-base font-bold">{m.title}</p>
                <p className="mt-0.5 text-xs text-foreground/60">
                  {QUESTIONS.length} 题 · 最高 {stats.best} 分
                </p>
              </div>
              <ArrowRight className="size-4 shrink-0 text-accent" />
            </div>
          ))}
        </div>

        <p className="mt-auto pt-10 text-center text-xs text-foreground/45">
          更多模块筹备中，敬请期待
        </p>
      </div>
    )
  }

  if (view === 'quiz') {
    return (
      <div className="mx-auto flex min-h-svh max-w-xl flex-col px-4 py-6 sm:py-10 md:max-w-3xl lg:max-w-5xl">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Button
              isIconOnly
              variant="ghost"
              size="sm"
              aria-label="返回模块列表"
              onPress={goPortal}
            >
              <ArrowLeft className="size-5" />
            </Button>
            <div className="grid size-9 place-items-center rounded-xl bg-accent text-base font-bold text-accent-foreground">
              申
            </div>
            <span className="font-bold tracking-tight">申论黑话挑战</span>
          </div>
          <Button
            isIconOnly
            variant="ghost"
            size="sm"
            aria-label="切换音效"
            onPress={() => {
              setSoundOn(!soundOn)
              LS.set(SOUND_KEY, !soundOn)
            }}
          >
            {soundOn ? <Volume2 className="size-5" /> : <VolumeX className="size-5" />}
          </Button>
        </header>

        <div className="flex flex-col items-center gap-8 py-10 text-center sm:py-14 md:flex-row md:items-start md:gap-12 md:text-left lg:py-16">
          <div className="md:flex-1">
            <Chip variant="soft" color="accent" size="lg" className="rounded-full font-normal">
              考公人的词汇速成手册
            </Chip>
            <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-5xl">
              把大白话，翻译成体制内的表达
            </h1>
            <p className="mx-auto mt-3 max-w-sm text-sm leading-7 text-foreground/60 md:mx-0 md:max-w-none md:text-base">
              看到材料别慌。给你一段场景，选出它的规范表达——答得越多，写得越像。
            </p>
          </div>

          <div className="grid w-full max-w-md grid-cols-4 gap-2 sm:gap-3 md:w-64 md:max-w-none md:shrink-0 md:grid-cols-2 lg:w-72">
            {[
              [QUESTIONS.length, '题库总量'],
              [stats.best, '最高分'],
              [stats.done, '累计作答'],
              [stats.wrong, '错题'],
            ].map(([num, label]) => (
              <div key={label as string} className="rounded-2xl bg-white px-2 py-3 text-center shadow-sm">
                <div className="text-lg font-bold tabular-nums text-accent sm:text-xl">{num}</div>
                <div className="mt-0.5 text-[11px] text-foreground/55">{label}</div>
              </div>
            ))}
          </div>
        </div>

        <p className="mt-10 mb-3 text-xs font-medium tracking-widest text-foreground/50">选择模式</p>
        <div className="grid gap-3 sm:grid-cols-2">
          {(
            [
              ['normal', 'MODE 01', '闯关答题', '20 道题，不限时间。选完即判，连击越高加分越多。'],
              ['speed', 'MODE 02', '60 秒速答', '争分夺秒，题目无限循环。手速和记忆力的双重考验。'],
              ['category', 'MODE 03', '分类专练', '八大主题逐个击破，政治管理、经济发展、文化建设……'],
              ['wrong', 'MODE 04', '错题重做', '只练答错过的题。答对一次就把它从错题本里移除。'],
            ] as const
          ).map(([mode, num, title, desc]) => (
            <div
              key={mode}
              role="button"
              tabIndex={0}
              onClick={() => (mode === 'category' ? setView('categories') : startGame(mode))}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') (mode === 'category' ? setView('categories') : startGame(mode))
              }}
              className="cursor-pointer rounded-2xl bg-white p-4 shadow-sm transition-all hover:shadow-md active:scale-[0.98]"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[11px] font-medium tracking-widest text-warning">{num}</p>
                  <p className="mt-1.5 text-base font-bold">{title}</p>
                  <p className="mt-1 text-[13px] leading-relaxed text-foreground/60">{desc}</p>
                </div>
                <ArrowRight className="mt-0.5 size-4 shrink-0 text-foreground/30" />
              </div>
            </div>
          ))}
        </div>

        <p className="mt-auto pt-10 text-center text-xs text-foreground/45">
          题库来源：《申论规范表达8页》整理版 · 进度与错题保存在本机浏览器
        </p>
      </div>
    )
  }

  if (view === 'categories') {
    return (
      <div className="mx-auto min-h-svh max-w-xl px-4 py-6 md:max-w-3xl">
        <header className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onPress={goHome}>
            <ArrowLeft className="size-4" /> 返回
          </Button>
          <Chip variant="soft" color="accent">分类专练</Chip>
        </header>
        <p className="mt-8 mb-3 text-xs font-medium tracking-widest text-foreground/50">选择一个主题</p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {CATS.map((c) => (
            <div
              key={c}
              role="button"
              tabIndex={0}
              onClick={() => startGame('category', c)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') startGame('category', c)
              }}
              className="cursor-pointer rounded-2xl bg-white p-4 shadow-sm transition-all hover:shadow-md active:scale-[0.98]"
            >
              <div className="flex items-center justify-between">
                <p className="font-bold">{c}</p>
                <span className="flex items-center gap-1 text-xs text-foreground/55">
                  {countByCat(c)} 题
                  <ArrowRight className="size-3.5" />
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (view === 'game') {
    const barPercent = g.mode === 'speed' ? (g.left / 60) * 100 : (g.idx / Math.max(g.queue.length, 1)) * 100
    const timerLow = g.mode === 'speed' && g.left <= 10
    const ok = g.locked && g.current && g.options[g.picked] === g.current.a
    return (
      <div className="mx-auto min-h-svh max-w-xl px-4 py-6 md:max-w-3xl">
        <header className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onPress={goHome}>
            <ArrowLeft className="size-4" /> 退出
          </Button>
          <Chip variant="soft" color="accent">
            {MODE_LABELS[g.mode]}{g.category && ` · ${g.category}`}
          </Chip>
          <div className="ml-auto flex items-center gap-4 text-right text-xs text-foreground/55">
            <div>
              <span className="text-base font-bold tabular-nums text-foreground">{g.score}</span> 分
            </div>
            <div>
              <span className="text-base font-bold tabular-nums text-foreground">
                {g.mode === 'speed' ? `第 ${g.idx + 1} 题` : `${g.idx + 1}/${g.queue.length}`}
              </span>
              <br />
              {g.mode === 'speed' ? (
                <>
                  <span className={`font-bold tabular-nums ${timerLow ? 'text-danger' : ''}`}>{g.left}</span> 秒
                </>
              ) : (
                '进度'
              )}
            </div>
          </div>
        </header>

        <ProgressBar aria-label="进度" value={barPercent} className="mt-4">
          <ProgressBar.Track className="h-1.5 overflow-hidden rounded-full bg-foreground/10">
            <ProgressBar.Fill className={`rounded-full ${timerLow ? 'bg-danger' : 'bg-accent'}`} />
          </ProgressBar.Track>
        </ProgressBar>

        <div className="mt-3 h-6 text-center">
          {g.combo >= 2 && (
            <span key={g.combo} className="text-sm font-bold text-accent">
              连击 × {g.combo} {'★'.repeat(Math.min(g.combo, 5))}
            </span>
          )}
        </div>

        {g.current && (
          <div className="mt-2 rounded-2xl bg-white p-5 shadow-sm sm:p-6 md:p-8">
            <Chip size="sm" variant="soft" color="accent" className="w-fit">{g.current.c}</Chip>
            <p className="mt-4 text-lg leading-relaxed font-semibold sm:text-xl md:text-2xl">{g.current.q}</p>
            <p className="mt-1.5 text-[13px] text-foreground/55">上面这种情况，对应的规范表达是？</p>

            <div className="mt-5 grid gap-2.5 sm:grid-cols-2 md:mt-6 md:gap-3">
              {g.options.map((o, i) => {
                const isCorrect = g.locked && o === g.current!.a
                const isWrong = g.locked && i === g.picked && o !== g.current!.a
                return (
                  <Button
                    key={`${g.idx}-${i}`}
                    variant="outline"
                    isDisabled={g.locked}
                    onPress={() => answer(i)}
                    className={`h-auto min-h-14 w-full justify-start gap-3 px-4 py-3 text-left font-normal tracking-normal normal-case ${
                      isCorrect ? 'border-success bg-success/10' : isWrong ? 'border-danger bg-danger/10' : ''
                    }`}
                  >
                    <span
                      className={`grid size-7 shrink-0 place-items-center rounded-lg text-xs font-bold ${
                        isCorrect ? 'bg-success text-success-foreground' : isWrong ? 'bg-danger text-danger-foreground' : 'bg-foreground/10 text-foreground/60'
                      }`}
                    >
                      {i + 1}
                    </span>
                    <span className="whitespace-normal leading-relaxed">{o}</span>
                  </Button>
                )
              })}
            </div>

            {g.locked && g.current && (
              <div className={`mt-5 flex-col items-stretch gap-2 rounded-xl p-4 ${ok ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'}`}>
                <div className="w-full">
                  <p className="font-bold">
                    {ok ? '答对了！' : '正确答案'}
                    {g.mode === 'wrong' && ok ? ' · 已从错题本移除' : ''}
                  </p>
                  {!ok && <p className="mt-1">{g.current.a}</p>}
                </div>
                <Button variant="secondary" size="sm" className="w-full sm:w-auto" onPress={next}>
                  {g.mode === 'speed' ? '下一题' : '继续'} →
                </Button>
              </div>
            )}
          </div>
        )}

        <p className="mt-4 text-center text-xs text-foreground/45">按键盘 1 / 2 / 3 / 4 快速选项，Enter 下一题</p>
      </div>
    )
  }

  /* view === 'result' */
  const total = g.correct + g.wrong
  const acc = total ? Math.round((g.correct / total) * 100) : 0
  const rank = acc >= 90 ? '黑话十级学者' : acc >= 75 ? '申论笔杆子' : acc >= 60 ? '渐入佳境' : '仍需修炼'
  return (
    <div className="mx-auto min-h-svh max-w-xl px-4 py-12 md:max-w-3xl">
      <div className="text-center">
        <p className="text-xs tracking-widest text-foreground/50">本局得分</p>
        <p className="mt-2 text-7xl font-bold tabular-nums text-accent sm:text-8xl">{g.score}</p>
        <Chip variant="primary" color="accent" size="lg" className="mt-4 rounded-full px-4 py-3 text-sm font-bold">
          {rank}
        </Chip>
      </div>

      <div className="mx-auto mt-8 grid max-w-md grid-cols-4 gap-2">
        {[
          [g.correct, '答对'],
          [g.wrong, '答错'],
          [`${acc}%`, '正确率'],
          [g.maxCombo, '最高连击'],
        ].map(([num, label]) => (
          <div key={label as string} className="rounded-2xl bg-white px-2 py-3 text-center shadow-sm">
            <div className="text-lg font-bold tabular-nums">{num}</div>
            <div className="mt-0.5 text-[11px] text-foreground/55">{label}</div>
          </div>
        ))}
      </div>

      {g.mistakes.length > 0 && (
        <div className="mx-auto mt-8 max-w-md rounded-2xl bg-white p-5 shadow-sm md:max-w-2xl">
          <p className="text-sm font-bold">本局错题回顾</p>
          <div className="mt-3">
            {g.mistakes.map((q) => (
              <div key={q.id} className="border-t border-dashed border-foreground/15 py-2.5 text-[13px] leading-relaxed first:border-t-0 first:pt-0">
                <p className="text-foreground/60">{q.q}</p>
                <p className="font-bold text-success">→ {q.a}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-8 flex justify-center gap-3">
        <Button onPress={() => startGame(g.mode, g.category)}>再来一局</Button>
        <Button variant="ghost" onPress={goHome}>返回主菜单</Button>
      </div>
    </div>
  )
}
