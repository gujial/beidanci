// pages/learn-over/learn-over.js
Page({
  data: {

  },
  onLoad(options) {

  },
  goToLearn: function () {
    wx.navigateTo({
      url: '/pages/learn/learn'
    })
  },
  goToIndex:function(){
    wx.navigateTo({
        url: '/pages/index/index'
      })
  }
})