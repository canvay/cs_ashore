/** 黑话挑战模块主页：统计 + 模式选择，返回走原生导航栏 */
import { QUESTIONS } from '../../utils/heihua-data'
import { getIds, readStats, WRONG_KEY } from '../../utils/store'

const MODE_CARDS = [
  ['normal', 'MODE 01', '闯关答题', '20 道题，不限时间。选完即判，连击越高加分越多。'],
  ['speed', 'MODE 02', '60 秒速答', '争分夺秒，题目无限循环。手速和记忆力的双重考验。'],
  ['category', 'MODE 03', '分类专练', '八大主题逐个击破，政治管理、经济发展、文化建设……'],
  ['wrong', 'MODE 04', '错题重做', '只练答错过的题。答对一次就把它从错题本里移除。'],
] as const

Page({
  data: {
    statsCards: [] as Array<{ num: number | string; label: string }>,
    modeCards: MODE_CARDS.map(([mode, num, title, desc]) => ({ mode, num, title, desc })),
  },

  onShow() {
    /* 从游戏页返回时刷新统计 */
    const s = readStats()
    this.setData({
      statsCards: [
        { num: QUESTIONS.length, label: '题库总量' },
        { num: s.best, label: '最高分' },
        { num: s.done, label: '累计作答' },
        { num: s.wrong, label: '错题' },
      ],
    })
  },

  onModeTap(e: WechatMiniprogram.TouchEvent) {
    const mode = e.currentTarget.dataset.mode as string
    if (mode === 'category') {
      wx.navigateTo({ url: '/pages/categories/index' })
      return
    }
    if (mode === 'wrong' && !getIds(WRONG_KEY).length) {
      wx.showToast({ title: '错题本还是空的，先去闯关攒几道错题吧', icon: 'none' })
      return
    }
    wx.navigateTo({ url: `/pages/game/index?mode=${mode}` })
  },
})
