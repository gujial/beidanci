// pages/checkIn/checkIn.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    checkInHistory: [],
    checkedDates: []
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    wx.cloud.callFunction({
        name: 'getCheckInHistory',
        success: res => {
          if (res.result.success) {
            this.setData({
              checkInHistory: res.result.data
            })
          } else {
            wx.showToast({ title: '加载打卡历史失败', icon: 'none' })
          }
        },
        fail: err => {
          wx.showToast({ title: '云函数调用失败', icon: 'none' })
        }
      })
      wx.cloud.callFunction({
        name: 'getMonthlyCheckIn',
        success: res => {
          if (res.result.success) {
            this.setData({
              checkedDates: res.result.data
            })
          }
        }
      })
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide() {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload() {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {

  }
})