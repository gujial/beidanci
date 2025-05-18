// 首页逻辑
Page({
  data: {
    welcomeText: '欢迎使用!',
    intro: '记得经常复习，提高你的英语词汇量吧'
  },
  // 跳转到学习页面
  goToLearn: function () {
    wx.navigateTo({
      url: '/pages/learn/learn'
    })
  },
  async onShow() {
    var page = this;
    wx.request({
      'url': 'https://v1.hitokoto.cn/?c=d&c=i',
      success(response) {
        page.setData({
          intro: response.data.hitokoto+`(${response.data.from_who}《${response.data.from}》)`
        });
      }
    })
  }
})
