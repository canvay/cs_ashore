/** 游戏核心逻辑（与 Web 端保持一致），供 game 页与模式入口页共用 */
import { ALL_ANSWERS, QUESTIONS, type HeihuaEntry } from './heihua-data'
import { getIds, WRONG_KEY } from './store'

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

/** 干扰项优先取与正确答案长度接近的表述，迷惑性更强（与 Web 端一致） */
export function makeOptions(answer: string): string[] {
  const pool = ALL_ANSWERS.filter((a) => a !== answer)
  pool.sort((a, b) => Math.abs(a.length - answer.length) - Math.abs(b.length - answer.length))
  const distract = shuffle(pool.slice(0, 28)).slice(0, 3)
  return shuffle([answer, ...distract])
}

/** 按模式组题；错题重做时若错题本为空返回空数组 */
export function buildQueue(mode: Mode, category = ''): HeihuaEntry[] {
  if (mode === 'speed') return shuffle(QUESTIONS)
  if (mode === 'category') return shuffle(QUESTIONS.filter((q) => q.c === category))
  if (mode === 'wrong') {
    const ids = getIds(WRONG_KEY)
    return shuffle(QUESTIONS.filter((q) => ids.includes(q.id)))
  }
  return shuffle(QUESTIONS).slice(0, 20)
}
