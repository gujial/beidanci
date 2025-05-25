Page({
    data: {
      currentWord: '',        // 当前单词
      options: [],            // 释义选项
      correctIndex: -1,       // 正确选项索引
      score: 0,
      correctCount: 0,
      incorrectCount: 0
    },
  
    onLoad: function() {
      this.loadWord()
    },
  
    // 加载单词
    loadWord: function() {
      wx.cloud.callFunction({
        name: 'getWords',    // 云函数名称
        data: {
          level: 'cet4'       // 可以动态切换为 cet6
        },
        success: res => {
          const result = res.result
          if (result && result.word && result.choices) {
            this.setData({
              currentWord: result.word,
              options: result.choices,
              correctIndex: result.correctIndex
            })
          } else {
            wx.showToast({ title: '获取单词失败', icon: 'none' })
          }
        },
        fail: () => {
          wx.showToast({ title: '云函数调用失败', icon: 'none' })
        }
      })
    },
  
    // 选择答案
    selectAnswer: function(e) {
      const selectedIndex = e.currentTarget.dataset.index
      const correctIndex = this.data.correctIndex
  
      if (selectedIndex === correctIndex) {
        this.setData({
          score: this.data.score + 1,
          correctCount: this.data.correctCount + 1
        })
        wx.showToast({ title: '答对了!', icon: 'success' })
      } else {
        this.setData({
          incorrectCount: this.data.incorrectCount + 1
        })
        wx.showToast({ title: '答错了', icon: 'none' })
      }
  
      setTimeout(() => {
        this.loadWord()
      }, 1000)
    },
  
    // 保存得分
    saveScore: function() {
      const score = this.data.score
      wx.setStorageSync('userScore', score)
    }
  })
  