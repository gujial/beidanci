Page({
    data: {
      top3: [],
      others: [],
      self: {}
    },
  
    onLoad() {
      this.getLeaderboard()
    },
  
    getLeaderboard() {
      wx.cloud.callFunction({
        name: 'getLeaderboard',
        success: res => {
          if (res.result.success) {
            const list = res.result.leaderboard
            const top3 = list.slice(0, 3)
            const others = list.slice(3)
            this.setData({
              top3,
              others,
              self: res.result.self
            })
          } else {
            wx.showToast({ title: '获取失败', icon: 'none' })
          }
        },
        fail: err => {
          wx.showToast({ title: '请求失败', icon: 'none' })
        }
      })
    }
  })
  