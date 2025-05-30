Page({
    data: {
      levelOptions: ['CET-4', 'CET-6'],
      levelIndex: 0,
      selectedLevel: 'cet4',
      selectedLevelName: 'CET-4',
      //每组单词数量选择
      wordCountOptions: [10, 15, 20, 30],  // 可选的单词数量
      wordCountIndex: 1,                   //当前索引
      selectedWordCount: 15,                // 默认选择索引（15个）

      enableSound: true,
      autoPlay: false
    },
  
    onLoad() {
      // 从本地加载设置
      const storedLevel = wx.getStorageSync('selectedLevel') || 'cet4'
      const index = storedLevel === 'cet6' ? 1 : 0
      
      const storedWordCount = wx.getStorageSync('selectedWordCount')
      const wordCountIndex = this.data.wordCountOptions.indexOf(storedWordCount) !== -1 
        ? this.data.wordCountOptions.indexOf(storedWordCount) 
        : 1 // 默认索引为1（15个）
        
      this.setData({
        selectedLevel: storedLevel,
        selectedLevelName: this.data.levelOptions[index],
        levelIndex: index,

        wordCountIndex: wordCountIndex,
        selectedWordCount: this.data.wordCountOptions[wordCountIndex],

        enableSound: wx.getStorageSync('enableSound') !== false,
        autoPlay: wx.getStorageSync('autoPlay') === true
      })
    },
  //词库更改
    onLevelChange(e) {
      const index = parseInt(e.detail.value)
      const level = index === 1 ? 'cet6' : 'cet4'
      const name = this.data.levelOptions[index]
  
      this.setData({
        levelIndex: index,
        selectedLevel: level,
        selectedLevelName: name
      })
  
      wx.setStorageSync('selectedLevel', level)
      wx.showToast({ title: '已保存默认词库', icon: 'success' })
    },
    //单词组数更改
    onWordCountChange(e) {
        const index = parseInt(e.detail.value)
        const count = this.data.wordCountOptions[index]
        
        this.setData({
          wordCountIndex: index,
          selectedWordCount: count
        })
        
        wx.setStorageSync('selectedWordCount', count)
        wx.showToast({ title: '已保存每组单词数量', icon: 'success' })
      },
  //答题音效
    onToggleSound(e) {
      const enabled = e.detail.value
      this.setData({ enableSound: enabled })
      wx.setStorageSync('enableSound', enabled)
    },
  //自动播放释义
    onToggleAutoPlay(e) {
      const enabled = e.detail.value
      this.setData({ autoPlay: enabled })
      wx.setStorageSync('autoPlay', enabled)
    },
  //清除缓存
    onClearStorage() {
      wx.showModal({
        title: '确认清除缓存？',
        content: '此操作将清除所有本地设置和分数记录。',
        success: res => {
          if (res.confirm) {
            wx.clearStorageSync()
            wx.showToast({ title: '已清除', icon: 'none' })
            this.onLoad() // 重新载入默认设置
          }
        }
      })
    }
  })
  