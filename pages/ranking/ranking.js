// 排行榜页面逻辑
Page({
  data: {
    userRank: {},
    rankings: []
  },
  onLoad: function() {
    this.loadRankings()
  },
  // 加载排行榜数据
  loadRankings: function() {
    // 获取用户得分
    const userScore = wx.getStorageSync('userScore') || 0
    const userRank = {
      name: '你',
      score: userScore
    }
    // 生成模拟排行榜数据
    const rankings = this.generateMockRankings(userScore)
    this.setData({
      userRank: userRank,
      rankings: rankings
    })
  },
  // 生成模拟排行榜数据
  generateMockRankings: function(userScore) {
    const rankings = [
      { name: '用户1', score: userScore + 10 },
      { name: '用户2', score: userScore + 5 },
      { name: '你', score: userScore },
      { name: '用户4', score: userScore - 3 },
      { name: '用户5', score: userScore - 10 }
    ]
    return rankings.sort((a, b) => b.score - a.score)
  },
  // 刷新排行榜
  refreshRanking: function() {
    wx.showLoading({
      title: '刷新中...',
    })
    setTimeout(() => {
      this.loadRankings()
      wx.hideLoading()
    }, 1000)
  }
})
