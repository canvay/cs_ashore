/** 文章详情页：按 slug 渲染 GuideBlock，表格转卡片，mermaid 不支持则跳过 */
import { getArticle } from '../../utils/guide-data'
import type { GuideBlock } from '../../utils/guide-data'

/** 渲染用视图块：与 GuideBlock 一一对应，表格已预处理成卡片 */
interface ViewBlock {
  kind: 'p' | 'h2' | 'list' | 'steps' | 'callout' | 'table'
  text: string
  tone: string
  items: string[]
  /** 表格卡片：每行一张卡，title 为首列，其余列转键值对 */
  cards: Array<{ title: string; entries: Array<{ k: string; v: string }> }>
}

function toViewBlocks(blocks: GuideBlock[]): ViewBlock[] {
  const out: ViewBlock[] = []
  for (const b of blocks) {
    switch (b.type) {
      case 'p':
        out.push({ kind: 'p', text: b.text, tone: '', items: [], cards: [] })
        break
      case 'h2':
        out.push({ kind: 'h2', text: b.text, tone: '', items: [], cards: [] })
        break
      case 'list':
        out.push({ kind: 'list', text: '', tone: '', items: b.items, cards: [] })
        break
      case 'steps':
        out.push({ kind: 'steps', text: '', tone: '', items: b.items, cards: [] })
        break
      case 'callout':
        out.push({ kind: 'callout', text: b.text, tone: b.tone, items: [], cards: [] })
        break
      case 'table':
        out.push({
          kind: 'table',
          text: '',
          tone: '',
          items: [],
          cards: b.rows.map((row) => ({
            title: row[0],
            entries: row.slice(1).map((v, i) => ({ k: b.head[i + 1], v })),
          })),
        })
        break
      case 'mermaid':
        /* 小程序不支持 mermaid，跳过（web 端渲染） */
        break
    }
  }
  return out
}

Page({
  data: {
    blocks: [] as ViewBlock[],
    notFound: false,
  },

  onLoad(options: Record<string, string | undefined>) {
    const article = getArticle(options.slug ?? '')
    if (!article) {
      this.setData({ notFound: true })
      return
    }
    wx.setNavigationBarTitle({ title: article.title })
    this.setData({ blocks: toViewBlocks(article.blocks) })
  },

  backToGuide() {
    wx.navigateBack()
  },
})
