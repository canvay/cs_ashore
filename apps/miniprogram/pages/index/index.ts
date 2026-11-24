import {
  ALL_ANSWERS,
  CATS,
  QUESTIONS,
  countByCat,
  type HeihuaEntry,
} from '../../utils/heihua-data'

type Mode = 'normal' | 'speed' | 'category' | 'wrong'
/** home = 模块首页（portal），quiz = 黑话挑战模块主页 */
type ViewName = 'home' | 'quiz' | 'categories' | 'game' | 'result'

/* ---------- 本地存储 ---------- */
const BEST_KEY = 'shenlun_best'
const DONE_KEY = 'shenlun_done'
const WRONG_KEY = 'shenlun_wrong'
const SOUND_KEY = 'shenlun_sound'

function getNum(key: string, fallback: number): number {
  const v = wx.getStorageSync(key)
  return v === '' || v === undefined ? fallback : Number(v)
}
function getIds(key: string): number[] {
  const v = wx.getStorageSync(key)
  return Array.isArray(v) ? v.map(Number) : []
}
function setStore(key: string, value: number | number[]) {
  wx.setStorageSync(key, value)
}
function getSoundOn(): boolean {
  return wx.getStorageSync(SOUND_KEY) !== 0
}
/** 播放答题音效（对应 Web 端的 Web Audio 合成提示音） */
function playAnswerSound(ok: boolean) {
  if (!getSoundOn()) return
  try {
    const ctx = wx.createInnerAudioContext()
    ctx.src = ok ? '/audio/correct.wav' : '/audio/wrong.wav'
    ctx.onEnded(() => ctx.destroy())
    ctx.onError(() => ctx.destroy())
    ctx.play()
  } catch {
    /* ignore */
  }
}
function readStats() {
  return {
    best: getNum(BEST_KEY, 0),
    done: getNum(DONE_KEY, 0),
    wrong: getIds(WRONG_KEY).length,
  }
}

/* ---------- 工具 ---------- */
function shuffle<T>(arr: readonly T[]): T[] {
  const a = arr.slice()
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/** 干扰项优先取与正确答案长度接近的表述，迷惑性更强（与 Web 端一致） */
function makeOptions(answer: string): string[] {
  const pool = ALL_ANSWERS.filter((a) => a !== answer)
  pool.sort((a, b) => Math.abs(a.length - answer.length) - Math.abs(b.length - answer.length))
  const distract = shuffle(pool.slice(0, 28)).slice(0, 3)
  return shuffle([answer, ...distract])
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

const MODE_LABELS: Record<Mode, string> = {
  normal: '闯关答题',
  speed: '60秒速答',
  category: '分类专练',
  wrong: '错题重做',
}

const MODE_CARDS = [
  ['normal', 'MODE 01', '闯关答题', '20 道题，不限时间。选完即判，连击越高加分越多。'],
  ['speed', 'MODE 02', '60 秒速答', '争分夺秒，题目无限循环。手速和记忆力的双重考验。'],
  ['category', 'MODE 03', '分类专练', '八大主题逐个击破，政治管理、经济发展、文化建设……'],
  ['wrong', 'MODE 04', '错题重做', '只练答错过的题。答对一次就把它从错题本里移除。'],
] as const

Page({
  data: {
    view: 'home' as ViewName,
    g: EMPTY_STATE as GameState,
    soundOn: true,
    /* 模块首页的入口卡片数据 */
    portal: { count: 0, best: 0, done: 0, wrong: 0 },
    stats: readStats(),
    statsCards: [] as Array<{ num: number | string; label: string }>,
    modeCards: MODE_CARDS.map(([mode, num, title, desc]) => ({ mode, num, title, desc })),
    catList: [] as Array<{ c: string; count: number }>,
    /* 游戏视图的派生渲染数据（类名/文案在 JS 里算好，WXML 保持简单） */
    game: {
      modeLabel: '',
      categorySuffix: '',
      progressText: '',
      timerLabel: '',
      timerLow: false,
      barPercent: 0,
      barLow: false,
      stars: '',
      locked: false,
      opts: [] as Array<{ text: string; cls: string; keyCls: string }>,
      explainCls: '',
      explainOk: false,
      explainTitle: '',
      nextLabel: '',
    },
    result: {
      rank: '',
      cards: [] as Array<{ num: number | string; label: string }>,
    },
    mistakes: [] as HeihuaEntry[],
  },

  lockRef: false, // 当前题是否已作答（比 data 更早生效，防连点）
  timerId: 0,
  nextTimeoutId: 0,

  /* ---------- 视图渲染 ---------- */

  /** 模块首页（portal） */
  renderPortal() {
    const s = readStats()
    this.setData({
      view: 'home',
      portal: { count: QUESTIONS.length, best: s.best, done: s.done, wrong: s.wrong },
    })
  },

  /** 黑话挑战模块主页 */
  renderQuiz() {
    const s = readStats()
    this.setData({
      soundOn: getSoundOn(),
      stats: s,
      statsCards: [
        { num: QUESTIONS.length, label: '题库总量' },
        { num: s.best, label: '最高分' },
        { num: s.done, label: '累计作答' },
        { num: s.wrong, label: '错题' },
      ],
    })
  },

  renderCategories() {
    this.setData({
      catList: CATS.map((c) => ({ c, count: countByCat(c) })),
    })
  },

  /** 把 GameState 映射成游戏视图的派生数据 */
  renderGame(g: GameState) {
    const barPercent =
      g.mode === 'speed' ? (g.left / 60) * 100 : (g.idx / Math.max(g.queue.length, 1)) * 100
    const timerLow = g.mode === 'speed' && g.left <= 10
    const ok = g.locked && g.current && g.options[g.picked] === g.current.a
    this.setData({
      g,
      game: {
        modeLabel: MODE_LABELS[g.mode],
        categorySuffix: g.category ? ` · ${g.category}` : '',
        progressText: g.mode === 'speed' ? `第 ${g.idx + 1} 题` : `${g.idx + 1}/${g.queue.length}`,
        timerLabel: g.mode === 'speed' ? `${g.left} 秒` : '进度',
        timerLow,
        barPercent,
        barLow: timerLow,
        stars: '★'.repeat(Math.min(g.combo, 5)),
        locked: g.locked,
        opts: g.options.map((o, i) => {
          const isCorrect = g.locked && o === g.current!.a
          const isWrong = g.locked && i === g.picked && o !== g.current!.a
          return {
            text: o,
            cls: isCorrect ? 'correct' : isWrong ? 'wrong' : '',
            keyCls: isCorrect ? 'key-correct' : isWrong ? 'key-wrong' : '',
          }
        }),
        explainCls: ok ? 'ok' : 'no',
        explainOk: !!ok,
        explainTitle:
          (ok ? '答对了！' : '正确答案') +
          (g.mode === 'wrong' && ok ? ' · 已从错题本移除' : ''),
        nextLabel: g.mode === 'speed' ? '下一题 →' : '继续 →',
      },
    })
  },

  renderResult(g: GameState) {
    const total = g.correct + g.wrong
    const acc = total ? Math.round((g.correct / total) * 100) : 0
    const rank =
      acc >= 90 ? '黑话十级学者' : acc >= 75 ? '申论笔杆子' : acc >= 60 ? '渐入佳境' : '仍需修炼'
    this.setData({
      g,
      mistakes: g.mistakes,
      result: {
        rank,
        cards: [
          { num: g.correct, label: '答对' },
          { num: g.wrong, label: '答错' },
          { num: `${acc}%`, label: '正确率' },
          { num: g.maxCombo, label: '最高连击' },
        ],
      },
    })
  },

  /* ---------- 生命周期 ---------- */

  onLoad() {
    this.renderPortal()
  },

  onUnload() {
    this.clearTimers()
  },

  clearTimers() {
    if (this.timerId) {
      clearInterval(this.timerId)
      this.timerId = 0
    }
    if (this.nextTimeoutId) {
      clearTimeout(this.nextTimeoutId)
      this.nextTimeoutId = 0
    }
  },

  /* ---------- 事件 ---------- */

  onModeTap(e: WechatMiniprogram.TouchEvent) {
    const mode = e.currentTarget.dataset.mode as Mode
    if (mode === 'category') {
      this.renderCategories()
      this.setData({ view: 'categories' })
      return
    }
    this.startGame(mode)
  },

  onCatTap(e: WechatMiniprogram.TouchEvent) {
    this.startGame('category', e.currentTarget.dataset.cat as string)
  },

  goPortal() {
    this.clearTimers()
    this.renderPortal()
  },

  openQuiz() {
    this.renderQuiz()
    this.setData({ view: 'quiz' })
  },

  /* 模块内返回（游戏退出/分类返回/结果页）都回到模块主页 */
  goHome() {
    this.clearTimers()
    this.renderQuiz()
    this.setData({ view: 'quiz' })
  },

  startGame(mode: Mode, category = '') {
    let queue: HeihuaEntry[]
    if (mode === 'speed') {
      queue = shuffle(QUESTIONS)
    } else if (mode === 'category') {
      queue = shuffle(QUESTIONS.filter((q) => q.c === category))
    } else if (mode === 'wrong') {
      const ids = getIds(WRONG_KEY)
      queue = shuffle(QUESTIONS.filter((q) => ids.includes(q.id)))
      if (!queue.length) {
        wx.showToast({ title: '错题本还是空的，先去闯关攒几道错题吧', icon: 'none' })
        return
      }
    } else {
      queue = shuffle(QUESTIONS).slice(0, 20)
    }
    this.clearTimers()
    this.lockRef = false
    const g: GameState = {
      ...EMPTY_STATE,
      mode,
      category,
      queue,
      current: queue[0],
      options: makeOptions(queue[0].a),
    }
    this.setData({ view: 'game' })
    this.renderGame(g)
    if (mode === 'speed') this.startTimer()
  },

  onOptionTap(e: WechatMiniprogram.TouchEvent) {
    const i = Number(e.currentTarget.dataset.index)
    const g = this.data.g
    if (this.lockRef || !g.current) return
    const q = g.current
    const ok = g.options[i] === q.a
    this.lockRef = true

    setStore(DONE_KEY, getNum(DONE_KEY, 0) + 1)
    let wrongIds = getIds(WRONG_KEY)
    if (ok) wrongIds = wrongIds.filter((x) => x !== q.id)
    else if (!wrongIds.includes(q.id)) wrongIds.push(q.id)
    setStore(WRONG_KEY, wrongIds)
    playAnswerSound(ok)
    try {
      wx.vibrateShort({ type: ok ? 'light' : 'heavy' })
    } catch {
      /* ignore */
    }

    const newCombo = ok ? g.combo + 1 : 0
    const next: GameState = {
      ...g,
      locked: true,
      picked: i,
      score: g.score + (ok ? 10 + Math.min(g.combo, 5) * 2 : 0),
      combo: newCombo,
      maxCombo: Math.max(g.maxCombo, newCombo),
      correct: g.correct + (ok ? 1 : 0),
      wrong: g.wrong + (ok ? 0 : 1),
      mistakes: ok ? g.mistakes : [...g.mistakes, q],
    }
    this.renderGame(next)

    /* 60 秒速答：作答后 750ms 自动进入下一题 */
    if (next.mode === 'speed') {
      this.nextTimeoutId = setTimeout(() => {
        this.nextTimeoutId = 0
        this.goNext()
      }, 750) as unknown as number
    }
  },

  onNextTap() {
    this.goNext()
  },

  onToggleSound() {
    const next = !getSoundOn()
    wx.setStorageSync(SOUND_KEY, next ? 1 : 0)
    this.setData({ soundOn: next })
  },

  goNext() {
    const g = this.data.g
    if (!g.current) return
    const ni = g.idx + 1
    if (g.mode !== 'speed' && ni >= g.queue.length) {
      this.finish()
      return
    }
    const q = g.queue[ni % g.queue.length]
    this.lockRef = false
    this.renderGame({
      ...g,
      idx: ni,
      locked: false,
      picked: -1,
      current: q,
      options: makeOptions(q.a),
    })
  },

  startTimer() {
    this.timerId = setInterval(() => {
      const g = this.data.g
      if (g.left <= 1) {
        this.clearTimers()
        this.finish()
        return
      }
      this.renderGame({ ...g, left: g.left - 1 })
    }, 1000) as unknown as number
  },

  finish() {
    const g = this.data.g
    this.clearTimers()
    const best = getNum(BEST_KEY, 0)
    if (g.score > best) setStore(BEST_KEY, g.score)
    this.renderResult(g)
    this.setData({ view: 'result' })
  },

  onReplay() {
    this.startGame(this.data.g.mode, this.data.g.category)
  },
})
