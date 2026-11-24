import { QUESTIONS_DATA } from './questions'

export interface HeihuaEntry {
  /** 稳定 id = 题库中的顺序号，错题本以它为键 */
  id: number
  /** 分类，如「政治管理类」 */
  c: string
  /** 材料/口语场景表述 */
  q: string
  /** 对应的规范表达（黑话） */
  a: string
}

export const QUESTIONS: HeihuaEntry[] = QUESTIONS_DATA.map((row, i) => ({
  id: i,
  ...row,
}))

export const ALL_ANSWERS: string[] = [...new Set(QUESTIONS.map((q) => q.a))]

export const CATS: string[] = [...new Set(QUESTIONS.map((q) => q.c))]

export const countByCat = (cat: string): number =>
  QUESTIONS.filter((q) => q.c === cat).length
