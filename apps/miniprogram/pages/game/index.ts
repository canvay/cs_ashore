/** 答题页（game/result 两态）：进入参数 ?mode=&category=，退出/返回走原生导航栏 */
import type { HeihuaEntry } from '../../utils/heihua-data'
import {
  buildQueue,
  EMPTY_STATE,
  makeOptions,
  MODE_LABELS,
  type GameState,
  type Mode,
} from '../../utils/game-core'
import { BEST_KEY, DONE_KEY, getIds, getNum, setStore, WRONG_KEY } from '../../utils/store'
import { getSoundOn, playAnswerSound, setSoundOn } from '../../utils/sound'

Page({
  data: {
    view: 'game' as 'game' | 'result',
    g: EMPTY_STATE as GameState,
    soundOn: true,
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

  onLoad(options: Record<string, string | undefined>) {
    const mode = (options.mode ?? 'normal') as Mode
    const category = options.category ? decodeURIComponent(options.category) : ''
    const queue = buildQueue(mode, category)
    if (!queue.length) {
      wx.showToast({ title: '错题本还是空的，先去闯关攒几道错题吧', icon: 'none' })
      this.goBack()
      return
    }
    this.lockRef = false
    const g: GameState = {
      ...EMPTY_STATE,
      mode,
      category,
      queue,
      current: queue[0],
      options: makeOptions(queue[0].a),
    }
    this.setData({ soundOn: getSoundOn() })
    this.renderGame(g)
    if (mode === 'speed') this.startTimer()
  },

  onUnload() {
    this.clearTimers()
  },

  /** 返回上一页；直接编译进入本页没有上级页面时兜底回首页 */
  goBack() {
    if (getCurrentPages().length > 1) wx.navigateBack()
    else wx.reLaunch({ url: '/pages/index/index' })
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
    setSoundOn(next)
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
    const { mode, category } = this.data.g
    const queue = buildQueue(mode, category)
    if (!queue.length) {
      /* 错题全部清空后再来一局：回模块主页 */
      wx.showToast({ title: '错题本已清空，太棒了！', icon: 'none' })
      this.goBack()
      return
    }
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

  onBackHome() {
    this.goBack()
  },
})
