Page({
    data: {
      levelOptions: ['CET-4', 'CET-6'],
      levelIndex: 0,
      selectedLevel: 'cet4',
      selectedLevelName: 'CET-4',
  
      enableSound: true,
      autoPlay: false
    },
  
    onLoad() {
      // 从本地加载设置
      const storedLevel = wx.getStorageSync('selectedLevel') || 'cet4'
      const index = storedLevel === 'cet6' ? 1 : 0
  
      this.setData({
        selectedLevel: storedLevel,
        selectedLevelName: this.data.levelOptions[index],
        levelIndex: index,
        enableSound: wx.getStorageSync('enableSound') !== false,
        autoPlay: wx.getStorageSync('autoPlay') === true
      })
    },
  
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
  
    onToggleSound(e) {
      const enabled = e.detail.value
      this.setData({ enableSound: enabled })
      wx.setStorageSync('enableSound', enabled)
    },
  
    onToggleAutoPlay(e) {
      const enabled = e.detail.value
      this.setData({ autoPlay: enabled })
      wx.setStorageSync('autoPlay', enabled)
    },
  
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
  