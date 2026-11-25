import { ALL_ANSWERS, QUESTIONS, type HeihuaEntry } from '@cs/heihua-data'
import { BEST_KEY, DONE_KEY, LS, WRONG_KEY } from './storage'

export type Mode = 'normal' | 'speed' | 'category' | 'wrong'

export interface GameState {
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

export const EMPTY_STATE: GameState = {
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

export const MODE_LABELS: Record<Mode, string> = {
  normal: '闯关答题',
  speed: '60秒速答',
  category: '分类专练',
  wrong: '错题重做',
}

export function shuffle<T>(arr: readonly T[]): T[] {
  const a = arr.slice()
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/** 干扰项优先取与正确答案长度接近的表述，迷惑性更强（与原版一致） */
export function makeOptions(answer: string): string[] {
  const pool = ALL_ANSWERS.filter((a) => a !== answer)
  pool.sort((a, b) => Math.abs(a.length - answer.length) - Math.abs(b.length - answer.length))
  const distract = shuffle(pool.slice(0, 28)).slice(0, 3)
  return shuffle([answer, ...distract])
}

export function readStats() {
  return {
    best: LS.get(BEST_KEY, 0),
    done: LS.get(DONE_KEY, 0),
    wrong: LS.get(WRONG_KEY, [] as number[]).length,
  }
}

export function beep(ok: boolean) {
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

/** 构建 startGame 用到的题目队列（错题本为空时返回 null，由调用方提示） */
export function buildQueue(mode: Mode, category: string): HeihuaEntry[] | null {
  if (mode === 'speed') return shuffle(QUESTIONS)
  if (mode === 'category') return shuffle(QUESTIONS.filter((q) => q.c === category))
  if (mode === 'wrong') {
    const ids = LS.get(WRONG_KEY, [] as number[])
    const queue = shuffle(QUESTIONS.filter((q) => ids.includes(q.id)))
    return queue.length ? queue : null
  }
  return shuffle(QUESTIONS).slice(0, 20)
}
