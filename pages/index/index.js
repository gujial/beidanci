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
  goToReview: function () {
    wx.navigateTo({
      url: '/pages/review/review'
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
  },

  onLoad() {
    wx.request({
        url: 'https://cn.bing.com/HPImageArchive.aspx',
        method: 'GET',
        data: {
          format: 'js',
          idx: 0,
          n: 1
        },
        success: (res) => {
          if (res.statusCode === 200) {
            const imageUrl = 'https://cn.bing.com' + res.data.images[0].url;
            console.log('Bing 背景图 URL:', imageUrl);
            // 设置为页面背景
            this.setData({
              backgroundImageUrl: imageUrl
            });
          }
        },
        fail: (err) => {
          console.error('获取 Bing 图片失败', err);
        }
      });      
  }
})
