Page({
  data: {
    currentWord: '',
        options: [],
        correctIndex: -1,
        score: 0,
        correctCount: 0,
        incorrectCount: 0,
        
        selectedWordCount: 15,//一组单词个数，默认为15
        groupCount:0,//当前完成背诵单词个数
        isGroupCompleted: false, // 是否完成一组学习

        levelOptions: ['CET-4', 'CET-6'],
        selectedLevel: 'cet4', // 实际传给云函数的值
        selectedLevelName: 'CET-4'
  },
  onLoad:function() {
    const savedLevel = wx.getStorageSync('selectedLevel')
        const savedLevelName = wx.getStorageSync('selectedLevelName')
        const savedWordCount = wx.getStorageSync('selectedWordCount') || 15;//加载本地每组单词个数

        if (savedLevel && savedLevelName) {
            this.setData({
                selectedLevel: savedLevel,
                selectedLevelName: savedLevelName, 
                selectedWordCount: savedWordCount
            })
        }
  },
      //云函数加载单词
      loadWord: function () {

        const { isGroupCompleted } = this.data;
        if (isGroupCompleted) return; // 已完成一组时不再加载新单词
        
        wx.cloud.callFunction({
            name: 'getReviewWords',
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
                    wx.showToast({
                        title: '获取单词失败',
                        icon: 'none'
                    })
                }
            },
            fail: () => {
                wx.showToast({
                    title: '云函数调用失败',
                    icon: 'none'
                })
            }
        })
    },
        //判断单词对错
        selectAnswer: function (e) {
            const selectedIndex = e.currentTarget.dataset.index
            const correctIndex = this.data.correctIndex
    
            if (selectedIndex === correctIndex) {
                this.setData({
                    score: this.data.score + 1,
                    correctCount: this.data.correctCount + 1,
                    groupCount:this.data.groupCount+1
                })
                wx.showToast({
                    title: '答对了!',
                    icon: 'success'
                })
            } else {
                this.setData({
                    incorrectCount: this.data.incorrectCount + 1
                })
                wx.showToast({
                    title: '答错了',
                    icon: 'none'
                })
            }
    
            setTimeout(() => {
                if (this.data.groupCount >= this.data.selectedWordCount) {
                    this.handleGroupCompleted(); // 触发完成一组逻辑
                }
            }, 1000)
                this.loadWord()
        },
        handleGroupCompleted:function(){
            const { selectedWordCount } = this.data;
            this.setData({
                groupCount:0,
                isGroupCompleted:true,
            })
            setTimeout(() => {
                wx.navigateTo({
                    url: `/pages/learn-over/learn-over` // 传递得分至结束页面
                });
            }, 1000);
        },
        //获取最终得分
        saveScore: function () {
            const score = this.data.score
            wx.setStorageSync('userScore', score)
        },
        //监听页面卸载
        onUnload: function () {
            const finalScore = this.data.score
            //记录词库选择
            wx.setStorageSync('selectedLevel', this.data.selectedLevel)
            wx.setStorageSync('selectedLevelName', this.data.selectedLevelName)
            //记录最终分数
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