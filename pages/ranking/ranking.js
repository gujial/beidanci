Page({
    data: {
      top3: [],
      others: [],
      self: {}
    },
  
    onLoad() {
      this.getLeaderboard();
    },
  
    async getLeaderboard() {
      wx.showLoading({ title: '加载中...' });
  
      try {
        const res = await wx.cloud.callFunction({
          name: 'getLeaderboard'
        });
  
        wx.hideLoading();
  
        if (!res.result.success) {
          wx.showToast({ title: '获取失败', icon: 'none' });
          return;
        }
  
        const list = res.result.leaderboard;
        const self = res.result.self;
  
        // 提取所有需要转换的 fileID
        const avatarFileIDs = list.map(item => item.avatarUrl);
        if (self.avatarUrl) avatarFileIDs.push(self.avatarUrl);
  
        // 获取 HTTPS 临时地址
        const tempUrlsRes = await wx.cloud.getTempFileURL({
          fileList: avatarFileIDs
        });
  
        const fileIDToUrl = {};
        tempUrlsRes.fileList.forEach(item => {
          fileIDToUrl[item.fileID] = item.tempFileURL;
        });
  
        // 替换排行榜头像链接
        const updatedList = list.map(item => ({
          ...item,
          avatarUrl: fileIDToUrl[item.avatarUrl] || '/images/default-avatar.png'
        }));
  
        const top3 = updatedList.slice(0, 3);
        const others = updatedList.slice(3);
  
        // 替换自己头像链接
        const updatedSelf = {
          ...self,
          avatarUrl: fileIDToUrl[self.avatarUrl] || '/images/default-avatar.png'
        };
  
        this.setData({
          top3,
          others,
          self: updatedSelf
        });
  
      } catch (err) {
        console.error(err);
        wx.hideLoading();
        wx.showToast({ title: '请求失败', icon: 'none' });
      }
    }
  });
  