Page({
    data: {
        currentWord: '',//当前单词
        options: [],//选项
        correctIndex: -1,//答案索引
        score: 0,//得分
        correctCount: 0,//正确个数
        incorrectCount: 0,//错误个数
        
        selectedWordCount: 15,//一组单词个数，默认为15
        groupCount:0,//当前完成背诵单词个数
        isGroupCompleted: false, // 是否完成一组学习

        levelOptions: ['CET-4', 'CET-6'],//词库选项（多余）
        selectedLevel: 'cet4', // 实际传给云函数的值
        selectedLevelName: 'CET-4',//默认选项

        wordId: -1,
        currentWeight: -1
    },

    onLevelChange: function (e) {
        const index = e.detail.value;
        let level, name;

        if (index === '2') { // 我的词库
            level = 'user';
            name = '我的词库';

            // 重置词库ID，准备展示词库选择器
            this.setData({
                selectedLevel: level,
                selectedLevelName: name,
                userBankId: '',
                // 重置统计数据
                score: 0,
                correctCount: 0,
                incorrectCount: 0
            }, () => {
                this.getUserBanks();
            });
            return;
        } else {
            level = index === '1' ? 'cet6' : 'cet4';
            name = this.data.levelOptions[index];
        }

        this.setData({
            selectedLevel: level,
            selectedLevelName: name,
            userBankId: '', // 清除用户词库ID
            showUserBankPicker: false,
            // 重置统计数据
            score: 0,
            correctCount: 0,
            incorrectCount: 0
        }, () => {
            this.loadWord();
        });
    },

    onLoad: function () {
        const savedLevel = wx.getStorageSync('selectedLevel')//调用本地词库等级
        const savedLevelName = wx.getStorageSync('selectedLevelName')//调用本地词库名称
        const savedWordCount = wx.getStorageSync('selectedWordCount') || 15;//加载本地每组单词个数
        //用户预设设置
        if (savedLevel && savedLevelName) {
            this.setData({
                selectedLevel: savedLevel,
                selectedLevelName: savedLevelName, 
                selectedWordCount: savedWordCount
            })
        }
        //加载单词函数
        this.loadWord()
    },
    //云函数加载单词
    loadWord: function () {
        // 已完成一组时不再加载新单词
        const  isGroupCompleted  = this.data.isGroupCompleted;
        if (isGroupCompleted) return; 
        
        wx.cloud.callFunction({
            name: 'getReviewWords',
            data: {
                level: this.data.selectedLevel
            },
            
            success: res => {
                if (res.result.success && res.result.data) {
                    if (res.result.data.length == 0) {
                        wx.showToast({
                            title: '没有需要复习的单词',
                            icon: 'none'
                        });
                        setTimeout(()=>wx.navigateBack(), 1000);
                    }
                  this.setData({
                    currentWord: res.result.data.word,
                    options: res.result.data.choices,
                    correctIndex: res.result.data.correctIndex,
                    wordId: res.result.data._id, // 保存单词ID
                    currentWeight: res.result.data.weight // 显示当前权重
                  });
                } else {
                    wx.showToast({
                        title: '获取单词失败',
                        icon: 'none'
                    })
                }
            },
            fail: (err) => {
                console.log(err)
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
            const isCorrect = true;
            this.handleAnswer(isCorrect);
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
    //处理答题结果
    handleAnswer(isCorrect) {
        wx.cloud.callFunction({
          name: 'updateReviewStatus',
          data: { wordId: this.data.wordId, isCorrect: isCorrect },
          success: (updateRes) => {
            if (updateRes.result.success) {
              // 更新分数和进度
              if (isCorrect) {
                this.setData({ score: this.data.score + 1 });
              }
            }
          }
        });
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