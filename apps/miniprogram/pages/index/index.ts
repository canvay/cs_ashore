/** 模块首页（portal）：点击模块 wx.navigateTo，返回由原生导航栏处理 */
import { QUESTIONS } from '../../utils/heihua-data'
import { listArticles } from '../../utils/guide-data'
import { readStats } from '../../utils/store'

Page({
  data: {
    portal: { count: 0, best: 0 },
    guide: { count: 0 },
  },

  onShow() {
    /* 从模块页返回时刷新最高分 */
    this.setData({
      portal: { count: QUESTIONS.length, best: readStats().best },
      guide: { count: listArticles().length },
    })
  },

  openGuide() {
    wx.navigateTo({ url: '/pages/guide/index' })
  },

  openQuiz() {
    wx.navigateTo({ url: '/pages/quiz/index' })
  },
})
