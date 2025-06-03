// pages/register/register.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    canIUsenickNameComp: wx.canIUse('button.open-type.chooseAvatar'),
    canIUseGetUserProfile: wx.canIUse('getUserProfile'),
    hasUserInfo: false,
    userInfo: {},
    avatarUrl: '',
    nickName: '',
    motto: '欢迎注册'
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {

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

  },

  onChooseAvatar(e) {
    this.setData({
      avatarUrl: e.detail.avatarUrl
    });
  },

  onInputChange(e) {
    this.setData({
      nickName: e.detail.value
    });
  },

  async onRegister() {
    const { avatarUrl, nickName } = this.data;

    if (!avatarUrl || !nickName) {
      wx.showToast({ title: '请完善信息', icon: 'none' });
      return;
    }

    wx.showLoading({ title: '注册中...' });

    try {
      // 上传头像到 cloud
      const cloudPath = 'avatar/' + Date.now() + '_' + Math.floor(Math.random() * 1000) + '.jpg';
      const uploadResult = await wx.cloud.uploadFile({
        cloudPath,              // 云端路径
        filePath: avatarUrl     // 临时本地文件路径
      });

      const fileID = uploadResult.fileID; // 云端 fileID

      // 调用云函数进行注册（使用上传后的 fileID）
      const response = await wx.cloud.callFunction({
        name: 'register',
        data: {
          avatarUrl: fileID,   // 传 fileID 而不是临时路径
          nickName
        }
      });

      wx.hideLoading();

      if (response.result.code === 0) {
        wx.setStorageSync('userInfo', response.result.data);
        wx.navigateBack();
      } else {
        wx.showToast({
          title: response.result.msg,
          icon: 'none',
          duration: 2000
        });
      }

    } catch (err) {
      wx.hideLoading();
      wx.showToast({
        title: '注册失败，请重试',
        icon: 'none'
      });
      console.error(err);
    }
  }
})