/** 分类专练：选主题进游戏，返回走原生导航栏 */
import { CATS, countByCat } from '../../utils/heihua-data'

Page({
  data: {
    catList: [] as Array<{ c: string; count: number }>,
  },

  onLoad() {
    this.setData({
      catList: CATS.map((c) => ({ c, count: countByCat(c) })),
    })
  },

  onCatTap(e: WechatMiniprogram.TouchEvent) {
    const cat = e.currentTarget.dataset.cat as string
    wx.navigateTo({ url: `/pages/game/index?mode=category&category=${encodeURIComponent(cat)}` })
  },
})
