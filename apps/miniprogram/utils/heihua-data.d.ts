/**
 * apps/miniprogram/utils/heihua-data.js 的类型声明（该文件由 scripts/build-miniprogram-data.mjs
 * 从 packages/heihua-data/src 打包生成，此声明与 packages/heihua-data/src/index.ts 保持一致）。
 */
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

export declare const QUESTIONS: HeihuaEntry[]
export declare const ALL_ANSWERS: string[]
export declare const CATS: string[]
export declare function countByCat(cat: string): number
