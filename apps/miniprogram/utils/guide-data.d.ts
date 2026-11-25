/**
 * apps/miniprogram/utils/guide-data.js 的类型声明（该文件由 scripts/build-miniprogram-guide-data.mjs
 * 从 packages/guide-data/src 打包生成，此声明与 packages/guide-data/src/index.ts 保持一致）。
 */

/** 文章正文块：结构化替代 markdown，渲染样式由各端自行控制 */
export type GuideBlock =
  | { type: 'p'; text: string }
  | { type: 'h2'; text: string }
  /** 无序列表 */
  | { type: 'list'; items: string[] }
  /** 有序步骤（流程/时间线用） */
  | { type: 'steps'; items: string[] }
  /** 对比表 */
  | { type: 'table'; head: string[]; rows: string[][] }
  /** Mermaid 图，web 端渲染；小程序端不支持，跳过 */
  | { type: 'mermaid'; code: string }
  /** 提示框：info 说明 / tip 建议 / warn 注意 */
  | { type: 'callout'; tone: 'info' | 'tip' | 'warn'; text: string }

export interface GuideArticle {
  /** URL 片段，如 'what-is-gongkao' */
  slug: string
  title: string
  /** 列表页摘要，一两句 */
  summary: string
  /** 展示用日期，如 '2026-11-25' */
  date: string
  /** 阅读顺序（列表按此排序，序言篇最小） */
  order: number
  /** 预估阅读分钟数 */
  minutes: number
  blocks: GuideBlock[]
}

export declare const ARTICLES: GuideArticle[]
export declare function listArticles(): GuideArticle[]
export declare function getArticle(slug: string): GuideArticle | undefined
