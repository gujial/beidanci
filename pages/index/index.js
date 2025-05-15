// 首页逻辑
Page({
  data: {
    welcomeText: '欢迎使用背单词小程序！'
  },
  // 跳转到学习页面
  goToLearn: function() {
    wx.navigateTo({
      url: '/pages/learn/learn'
    })
  },
  // 跳转到排行榜页面
  goToRanking: function() {
    wx.navigateTo({
      url: '/pages/ranking/ranking'
    })
  }
})
