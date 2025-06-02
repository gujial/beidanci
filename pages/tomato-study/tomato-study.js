const app = getApp()

Page({
  data: {
    formatTime: '25:00',
    totalTime: 25 * 60,
    remainingTime: 25 * 60,
    isTimerRunning: false,
    timerStatus: '准备开始学习',
    studyModes: ['单词学习', '复习模式', '听力训练'],
    currentStudyMode: '单词学习',
    currentWord: null,
    isStudying: false,
    completedTomatoCount: 0,
    totalStudyTime: 0,
    progressPercentage: 0,
    studyHistory: [],
    modeStatistics: {
      '单词学习': 0,
      '复习模式': 0,
      '听力训练': 0
    }
  },

  onLoad() {
    this.loadStudyData()
    this.initWordList()
  },

  // 加载持久化的学习数据
  loadStudyData() {
    const studyData = wx.getStorageSync('tomatoStudyData') || {
      completedTomatoCount: 0,
      totalStudyTime: 0,
      studyHistory: [],
      modeStatistics: {
        '单词学习': 0,
        '复习模式': 0,
        '听力训练': 0
      }
    }

    this.setData({
      completedTomatoCount: studyData.completedTomatoCount,
      totalStudyTime: studyData.totalStudyTime,
      studyHistory: studyData.studyHistory,
      modeStatistics: studyData.modeStatistics
    })
  },

  // 保存学习数据
  saveStudyData() {
    const { completedTomatoCount, totalStudyTime, studyHistory, modeStatistics } = this.data
    wx.setStorageSync('tomatoStudyData', {
      completedTomatoCount,
      totalStudyTime,
      studyHistory,
      modeStatistics
    })
  },

  initWordList() {
    const wordList = wx.getStorageSync('wordList') || []
    if (wordList.length > 0) {
      const currentWord = wordList[Math.floor(Math.random() * wordList.length)]
      this.setData({ currentWord })
    }
  },

  startTimer() {
    this.setData({
      isTimerRunning: true,
      timerStatus: '专注学习中',
      isStudying: true
    })

    this.timer = setInterval(() => {
      this.updateTimer()
    }, 1000)
  },

  updateTimer() {
    let { remainingTime, totalTime } = this.data
    remainingTime--

    const minutes = Math.floor(remainingTime / 60)
    const seconds = remainingTime % 60
    const formatTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`

    const progressPercentage = ((totalTime - remainingTime) / totalTime) * 100

    this.setData({
      formatTime,
      remainingTime,
      progressPercentage
    })

    if (remainingTime <= 0) {
      this.completeTimer()
    }
  },

  completeTimer() {
    clearInterval(this.timer)
    
    const { currentStudyMode, currentWord } = this.data
    const studyRecord = {
      date: new Date().toLocaleString(),
      mode: currentStudyMode,
      word: currentWord,
      duration: 25
    }

    const modeStatistics = { ...this.data.modeStatistics }
    modeStatistics[currentStudyMode]++

    this.setData({
      isTimerRunning: false,
      timerStatus: '学习完成',
      completedTomatoCount: this.data.completedTomatoCount + 1,
      totalStudyTime: this.data.totalStudyTime + 25,
      remainingTime: this.data.totalTime,
      formatTime: '25:00',
      progressPercentage: 0,
      studyHistory: [...this.data.studyHistory, studyRecord],
      modeStatistics
    }, () => {
      this.saveStudyData()
    })

    wx.showToast({
      title: '番茄学习完成！',
      icon: 'success',
      duration: 2000
    })

    this.initWordList() // 切换新单词
  },

  pauseTimer() {
    clearInterval(this.timer)
    this.setData({
      isTimerRunning: false,
      timerStatus: '学习已暂停'
    })
  },

  resetTimer() {
    clearInterval(this.timer)
    this.setData({
      isTimerRunning: false,
      timerStatus: '准备开始学习',
      remainingTime: this.data.totalTime,
      formatTime: '25:00',
      progressPercentage: 0
    })
  },

  selectStudyMode(e) {
    const index = e.detail.value
    this.setData({
      currentStudyMode: this.data.studyModes[index]
    })
  },

  // 查看学习历史
  viewStudyHistory() {
    wx.navigateTo({
      url: '/pages/study-history/study-history',
      success: (res) => {
        res.eventChannel.emit('acceptDataFromOpenerPage', {
          studyHistory: this.data.studyHistory,
          modeStatistics: this.data.modeStatistics
        })
      }
    })
  },

  onUnload() {
    clearInterval(this.timer)
    this.saveStudyData()
  }
}) 