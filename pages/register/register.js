Page({
    data: {
      canIUsenickNameComp: wx.canIUse('button.open-type.chooseAvatar'),
      canIUseGetUserProfile: wx.canIUse('getUserProfile'),
      hasUserInfo: false,
      userInfo: {},
      avatarUrl: '',    // 云存储的 fileID
      tmpAvatarPath: '', // 临时路径，用于上传
      nickName: '',
      motto: '欢迎注册'
    },
  
    onChooseAvatar(e) {
      const tmpPath = e.detail.avatarUrl;
      this.setData({ tmpAvatarPath: tmpPath });
  
      // 上传头像到云存储
      const cloudPath = 'avatars/' + Date.now() + '-' + Math.floor(Math.random() * 100000) + '.jpg';
      wx.cloud.uploadFile({
        cloudPath,
        filePath: tmpPath,
        success: res => {
          this.setData({
            avatarUrl: res.fileID // 用 fileID 替换临时路径
          });
          wx.showToast({ title: '头像上传成功', icon: 'success' });
        },
        fail: err => {
          console.error('头像上传失败', err);
          wx.showToast({ title: '头像上传失败', icon: 'none' });
        }
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
        const response = await wx.cloud.callFunction({
          name: 'register',
          data: {
            avatarUrl, // 这是 fileID
            nickName
          }
        });
  
        wx.hideLoading();
        if (response.result.code === 0) {
          wx.setStorageSync('userInfo', response.result.data);
          wx.navigateBack();
        } else {
          wx.showToast({
            title: response.result.msg || '注册失败',
            icon: 'none'
          });
        }
      } catch (err) {
        wx.hideLoading();
        console.error('注册错误', err);
        wx.showToast({
          title: '注册失败，请稍后再试',
          icon: 'none'
        });
      }
    }
  });
  