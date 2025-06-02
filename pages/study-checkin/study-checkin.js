const app = getApp()

Page({
  data: {
    currentMonth: '',
    calendarDays: [],
    continuousDays: 0,
    totalStudyTime: 0,
    isCheckedToday: false,
    studyDetails: [],
    weeklyStudyTime: [],
    monthlyStudyTime: [],
    achievements: [
      { 
        name: '新手上路', 
        icon: '/images/badges/beginner.png', 
        achieved: false 
      },
      { 
        name: '坚持7天', 
        icon: '/images/badges/week.png', 
        achieved: false 
      },
      { 
        name: '学习达人', 
        icon: '/images/badges/master.png', 
        achieved: false 
      }
    ]
  },

  onLoad() {
    this.initCalendar()
    this.loadUserStudyData()
    this.calculateStudyTrends()
  },

  // 计算学习趋势
  calculateStudyTrends() {
    const studyDetails = this.data.studyDetails
    
    // 计算每周学习时长
    const weeklyStudyTime = this.calculateWeeklyStudyTime(studyDetails)
    
    // 计算每月学习时长
    const monthlyStudyTime = this.calculateMonthlyStudyTime(studyDetails)

    this.setData({
      weeklyStudyTime,
      monthlyStudyTime
    })
  },

  calculateWeeklyStudyTime(studyDetails) {
    const today = new Date()
    const weekStart = new Date(today.getFullYear(), today.getMonth(), today.getDate() - today.getDay())
    
    return studyDetails.filter(detail => {
      const detailDate = new Date(detail.date)
      return detailDate >= weekStart
    }).reduce((total, detail) => total + detail.studyTime, 0)
  },

  calculateMonthlyStudyTime(studyDetails) {
    const today = new Date()
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)
    
    return studyDetails.filter(detail => {
      const detailDate = new Date(detail.date)
      return detailDate >= monthStart
    }).reduce((total, detail) => total + detail.studyTime, 0)
  },

  initCalendar() {
    const date = new Date()
    const year = date.getFullYear()
    const month = date.getMonth()
    
    this.setData({
      currentMonth: `${year}年${month + 1}月`
    })

    const days = new Date(year, month + 1, 0).getDate()
    const firstDay = new Date(year, month, 1).getDay()

    const calendarDays = []
    
    // 填充前面的空白
    for (let i = 0; i < firstDay; i++) {
      calendarDays.push({ day: '', status: 'empty' })
    }

    // 填充日期
    for (let i = 1; i <= days; i++) {
      const checkInStatus = this.checkDayStatus(year, month, i)
      calendarDays.push({ 
        day: i, 
        date: `${year}-${month + 1}-${i}`,
        status: checkInStatus 
      })
    }

    this.setData({ calendarDays })
  },

  checkDayStatus(year, month, day) {
    const checkInRecords = wx.getStorageSync('checkInRecords') || []
    const dateString = `${year}-${month + 1}-${day}`
    
    return checkInRecords.includes(dateString) ? 'checked' : 'unchecked'
  },

  loadUserStudyData() {
    const userData = wx.getStorageSync('userData') || {
      continuousDays: 0,
      totalStudyTime: 0,
      studyDetails: []
    }

    const today = this.formatDate(new Date())
    const checkInRecords = wx.getStorageSync('checkInRecords') || []
    
    this.setData({
      continuousDays: userData.continuousDays,
      totalStudyTime: userData.totalStudyTime,
      studyDetails: userData.studyDetails || [],
      isCheckedToday: checkInRecords.includes(today)
    })

    this.calculateStudyTrends()
    this.updateAchievements()
  },

  formatDate(date) {
    const year = date.getFullYear()
    const month = date.getMonth() + 1
    const day = date.getDate()
    return `${year}-${month}-${day}`
  },

  checkIn() {
    const today = this.formatDate(new Date())
    const checkInRecords = wx.getStorageSync('checkInRecords') || []
    
    if (!checkInRecords.includes(today)) {
      checkInRecords.push(today)
      wx.setStorageSync('checkInRecords', checkInRecords)

      const userData = wx.getStorageSync('userData') || {}
      userData.continuousDays = (userData.continuousDays || 0) + 1
      userData.totalStudyTime = (userData.totalStudyTime || 0) + 30 // 默认30分钟

      // 添加学习详情
      const studyDetail = {
        date: today,
        studyTime: 30,
        type: '每日打卡'
      }
      userData.studyDetails = userData.studyDetails || []
      userData.studyDetails.push(studyDetail)

      wx.setStorageSync('userData', userData)

      this.loadUserStudyData()
      this.initCalendar()

      wx.showToast({
        title: '打卡成功！',
        icon: 'success',
        duration: 2000
      })
    }
  },

  updateAchievements() {
    const { continuousDays } = this.data
    const achievements = this.data.achievements.map(achievement => {
      if (achievement.name === '新手上路' && continuousDays >= 1) {
        achievement.achieved = true
      }
      if (achievement.name === '坚持7天' && continuousDays >= 7) {
        achievement.achieved = true
      }
      if (achievement.name === '学习达人' && continuousDays >= 30) {
        achievement.achieved = true
      }
      return achievement
    })

    this.setData({ achievements })
  },

  // 查看学习详情
  viewStudyDetails() {
    wx.navigateTo({
      url: '/pages/study-details/study-details',
      success: (res) => {
        res.eventChannel.emit('acceptDataFromOpenerPage', {
          studyDetails: this.data.studyDetails,
          weeklyStudyTime: this.data.weeklyStudyTime,
          monthlyStudyTime: this.data.monthlyStudyTime
        })
      }
    })
  },

  selectDate(e) {
    const { date } = e.currentTarget.dataset
    wx.showModal({
      title: '学习记录',
      content: `日期：${date}`,
      showCancel: false
    })
  }
}) 