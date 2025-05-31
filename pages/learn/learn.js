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

        levelOptions: ['CET-4', 'CET-6', '我的词库'],
        selectedLevel: 'cet4', // 实际传给云函数的值
        selectedLevelName: 'CET-4',
        userBankId: '', // 用户自定义词库ID
        userBanks: [], // 用户词库列表
        showUserBankPicker: false // 是否显示用户词库选择器
    },

    onLoad: function (options) {
        // 如果从词库详情页面跳转过来，带有词库ID
        if (options.bankId) {
            this.setData({
                userBankId: options.bankId,
                selectedLevel: 'user',
                selectedLevelName: options.bankName || '我的词库'
            });
            this.loadWord();
            return;
        }

        const savedLevel = wx.getStorageSync('selectedLevel')
        const savedLevelName = wx.getStorageSync('selectedLevelName')
        const savedWordCount = wx.getStorageSync('selectedWordCount') || 15;//加载本地每组单词个数
        const savedUserBankId = wx.getStorageSync('userBankId')

        if (savedLevel && savedLevelName) {
            this.setData({
                selectedLevel: savedLevel,
                selectedLevelName: savedLevelName, 
                selectedWordCount: savedWordCount
            })
        }
        this.loadWord()
                selectedLevelName: savedLevelName,
                userBankId: savedUserBankId || ''
            })
        }

        // 如果选择的是用户词库但没有指定ID，获取用户词库列表
        if (this.data.selectedLevel === 'user' && !this.data.userBankId) {
            this.getUserBanks();
        } else {
            this.loadWord();
        }

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

    onShow: function() {
        // 如果选择的是用户词库，刷新词库列表
        if (this.data.selectedLevel === 'user' && !this.data.userBankId) {
            this.getUserBanks();
        }
    },

    // 获取用户词库列表
    getUserBanks: function() {
        wx.showLoading({
            title: '加载词库...',
        });

        wx.cloud.database().collection('wordbanks')
            .where({
                _openid: '{openid}' // 自动替换为用户openid
            })
            .get()
            .then(res => {
                wx.hideLoading();
                
                if (res.data && res.data.length > 0) {
                    this.setData({
                        userBanks: res.data,
                        showUserBankPicker: true
                    });
                } else {
                    // 没有词库时提示用户
                    wx.showModal({
                        title: '提示',
                        content: '您还没有创建个人词库，是否前往创建？',
                        success: (res) => {
                            if (res.confirm) {
                                wx.navigateTo({
                                    url: '/pages/wordbank/wordbank'
                                });
                            } else {
                                // 用户取消，切换回默认词库
                                this.setData({
                                    selectedLevel: 'cet4',
                                    selectedLevelName: 'CET-4',
                                    userBankId: ''
                                });
                                this.loadWord();
                            }
                        }
                    });
                }
            })
            .catch(err => {
                wx.hideLoading();
                console.error('获取词库失败', err);
                wx.showToast({
                    title: '获取词库失败',
                    icon: 'none'
                });
            });
    },

    // 选择用户词库
    onUserBankChange: function(e) {
        const index = e.detail.value;
        const bank = this.data.userBanks[index];
        
        // 检查词库是否有单词
        if (!bank.words || bank.words.length === 0) {
            wx.showToast({
                title: '该词库为空，请先添加单词',
                icon: 'none',
                duration: 2000
            });
            return;
        }
        
        if (bank.words.length < 1) {
            wx.showToast({
                title: '词库中单词数量不足，至少需要1个单词',
                icon: 'none',
                duration: 2000
            });
            return;
        }
        
        this.setData({
            userBankId: bank._id,
            selectedLevelName: bank.name,
            showUserBankPicker: false,
            // 重置统计数据
            score: 0,
            correctCount: 0,
            incorrectCount: 0
        }, () => {
            this.loadWord();
        });
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
    //云函数加载单词
    loadWord: function () {

        const { isGroupCompleted } = this.data;
        if (isGroupCompleted) return; // 已完成一组时不再加载新单词
        
        // 如果是用户词库但没有选择具体词库，则不加载
        if (this.data.selectedLevel === 'user' && !this.data.userBankId) {
            return;
        }

        wx.showLoading({
            title: '加载中...',
        });

        const data = {
            level: this.data.selectedLevel
        };

        // 如果是用户词库，添加词库ID
        if (this.data.selectedLevel === 'user') {
            data.userBankId = this.data.userBankId;
        }

        wx.cloud.callFunction({
            name: 'getWords',
            data: data,
            success: res => {
                wx.hideLoading();
                const result = res.result;
                if (result && result.word && result.choices) {
                    this.setData({
                        currentWord: result.word,
                        options: result.choices,
                        correctIndex: result.correctIndex
                    });
                } else {
                    wx.showToast({
                        title: result.error || '获取单词失败',
                        icon: 'none'
                    });
                }
            },
            fail: (err) => {
                wx.hideLoading();
                console.error('云函数调用失败', err);
                wx.showToast({
                    title: '云函数调用失败',
                    icon: 'none'
                });
            }
        });
    },
    //判断单词对错
    selectAnswer: function (e) {
        const selectedIndex = e.currentTarget.dataset.index;
        const correctIndex = this.data.correctIndex;

        if (selectedIndex === correctIndex) {
            this.setData({
                score: this.data.score + 1,
                correctCount: this.data.correctCount + 1,
                groupCount:this.data.groupCount+1
            });
            wx.showToast({
                title: '答对了!',
                icon: 'success'
            });
        } else {
            this.setData({
                incorrectCount: this.data.incorrectCount + 1
            });
            wx.showToast({
                title: '答错了',
                icon: 'none'
            });
        }

        setTimeout(() => {
            if (this.data.groupCount >= this.data.selectedWordCount) {
                this.handleGroupCompleted(); // 触发完成一组逻辑
            }
          
           this.loadWord();
        }, 1000)
           
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
        const score = this.data.score;
        wx.setStorageSync('userScore', score);
    },
    //监听页面卸载
    onUnload: function () {
        const finalScore = this.data.score;

        wx.setStorageSync('selectedLevel', this.data.selectedLevel);
        wx.setStorageSync('selectedLevelName', this.data.selectedLevelName);
        wx.setStorageSync('userBankId', this.data.userBankId);

        if (finalScore > 0) {
            wx.cloud.callFunction({
                name: 'score',
                data: {
                    score: finalScore
                },
                success: res => {
                    console.log('分数已记录：', res.result);
                },
                fail: err => {
                    console.error('记录分数失败：', err);
                }
            });
        }
    },

    // 跳转到词库管理页面
    goToWordbank: function() {
        wx.navigateTo({
            url: '/pages/wordbank/wordbank'
        });
    }
});