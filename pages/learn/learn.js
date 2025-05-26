Page({
    data: {
      currentWord: '',
      options: [],
      correctIndex: -1,
      score: 0,
      correctCount: 0,
      incorrectCount: 0,
  
      levelOptions: ['CET-4', 'CET-6'],
      selectedLevel: 'cet4', // 实际传给云函数的值
      selectedLevelName: 'CET-4'
    },
  
    onLoad: function() {
      this.loadWord()

      wx.cloud.callFunction({
        name: 'checkIn',
        success: res => {
          if (res.result.success) {
            if (!res.result.checkedIn) {
              console.log('今日打卡成功，连续天数：', res.result.streak)
            } else {
              console.log('今日已打卡，连续天数：', res.result.streak)
            }
            this.setData({
              streakDays: res.result.streak
            })
          }
        },
        fail: err => {
          console.error('打卡失败', err)
        }
      })
    },
  
    onLevelChange: function(e) {
      const index = e.detail.value
      const level = index === '1' ? 'cet6' : 'cet4'
      const name = this.data.levelOptions[index]
  
      this.setData({
        selectedLevel: level,
        selectedLevelName: name,
        // 重置统计数据
        score: 0,
        correctCount: 0,
        incorrectCount: 0
      }, () => {
        this.loadWord()
      })
    },
  
    loadWord: function() {
      wx.cloud.callFunction({
        name: 'getWords',
        data: {
          level: this.data.selectedLevel
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
  
    saveScore: function() {
      const score = this.data.score
      wx.setStorageSync('userScore', score)
    },

    onUnload: function () {
        const finalScore = this.data.score
        if (finalScore > 0) {
          wx.cloud.callFunction({
            name: 'score',
            data: {
              score: finalScore
            },
            success: res => {
              console.log('分数已记录：', res.result)
            },
            fail: err => {
              console.error('记录分数失败：', err)
            }
          })
        }
      }
      
  })
  