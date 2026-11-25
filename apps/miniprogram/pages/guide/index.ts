/** 指南文章列表页：点击卡片进详情页 */
import { listArticles } from '../../utils/guide-data'

Page({
  data: {
    articles: [] as Array<{
      slug: string
      title: string
      summary: string
      meta: string
      orderLabel: string
    }>,
  },

  onLoad() {
    this.setData({
      articles: listArticles().map((a) => ({
        slug: a.slug,
        title: a.title,
        summary: a.summary,
        meta: `${a.date} · 约 ${a.minutes} 分钟`,
        orderLabel: String(a.order).padStart(2, '0'),
      })),
    })
  },

  openArticle(e: WechatMiniprogram.TouchEvent) {
    const slug = e.currentTarget.dataset.slug as string
    wx.navigateTo({ url: `/pages/article/index?slug=${slug}` })
  },
})
