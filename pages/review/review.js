Page({
    data: {
      currentWord: {},
      options: [],
      correctIndex: -1,
      score: 0,
      correctCount: 0,
      incorrectCount: 0,
      selectedWordCount: 15,
      groupCount: 0,
      isGroupCompleted: false,
      showMeaning: false,
  
      selectedLevel: 'cet4',
      selectedLevelName: 'CET-4',
      wordId: '',
      currentWeight: -1,
    },
  
    onLoad: function () {
      const savedLevel = wx.getStorageSync('selectedLevel');
      const savedLevelName = wx.getStorageSync('selectedLevelName');
      const savedWordCount = wx.getStorageSync('selectedWordCount') || 15;
      if (savedLevel && savedLevelName) {
        this.setData({
          selectedLevel: savedLevel,
          selectedLevelName: savedLevelName,
          selectedWordCount: savedWordCount,
        });
      }
      this.loadWord();
    },
  
    loadWord: function () {
      if (this.data.isGroupCompleted) return;
  
      wx.cloud.callFunction({
        name: 'getReviewWords',
        data: {
          level: this.data.selectedLevel,
        },
        success: res => {
          const result = res.result;
          if (result.success && result.data) {
            if (result.data.length === 0) {
              wx.showToast({
                title: '没有需要复习的单词',
                icon: 'none',
              });
              setTimeout(() => wx.navigateBack(), 1000);
              return;
            }
  
            this.setData({
              currentWord: {
                english: result.data.word,
                chinese: result.data.choices[result.data.correctIndex],
                pronunciation: '', // 可自行拓展
              },
              options: result.data.choices,
              correctIndex: result.data.correctIndex,
              wordId: result.data._id,
              currentWeight: result.data.weight,
              showMeaning: false,
              groupCount: this.data.groupCount + 1,
            });
          } else {
            wx.showToast({
              title: '获取单词失败',
              icon: 'none',
            });
          }
        },
        fail: err => {
          console.error(err);
          wx.showToast({
            title: '云函数调用失败',
            icon: 'none',
          });
        },
      });
    },
  
    selectAnswer: function (e) {
      const selectedIndex = e.currentTarget.dataset.index;
      const correctIndex = this.data.correctIndex;
      const isCorrect = selectedIndex === correctIndex;
  
      if (isCorrect) {
        this.setData({
          correctCount: this.data.correctCount + 1,
          score: this.data.score + 1,
        });
        wx.showToast({ title: '答对了!', icon: 'success' });
      } else {
        this.setData({
          incorrectCount: this.data.incorrectCount + 1,
        });
        wx.showToast({ title: '答错了', icon: 'none' });
      }
  
      this.handleAnswer(isCorrect);
  
      setTimeout(() => {
        if (this.data.groupCount >= this.data.selectedWordCount) {
          this.handleGroupCompleted();
        } else {
          this.loadWord();
        }
      }, 800);
    },
  
    handleAnswer(isCorrect) {
      wx.cloud.callFunction({
        name: 'updateReviewStatus',
        data: {
          wordId: this.data.wordId,
          isCorrect: isCorrect,
        },
      });
    },
  
    handleGroupCompleted: function () {
      this.setData({
        groupCount: 0,
        isGroupCompleted: true,
      });
      setTimeout(() => {
        wx.navigateTo({
          url: `/pages/learn-over/learn-over`,
        });
      }, 1000);
    },
  
    toggleMeaning: function () {
      this.setData({ showMeaning: !this.data.showMeaning });
    },
  
    rateMemory: function (e) {
      const difficulty = e.currentTarget.dataset.difficulty;
      console.log(`记忆难度选择：${difficulty}`);
      // 可扩展：调用云函数保存该评分
    },
  
    onUnload: function () {
      wx.setStorageSync('selectedLevel', this.data.selectedLevel);
      wx.setStorageSync('selectedLevelName', this.data.selectedLevelName);
      if (this.data.score > 0) {
        wx.cloud.callFunction({
          name: 'score',
          data: {
            score: this.data.score,
          },
        });
      }
    },
  });
  