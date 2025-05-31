Page({
  data: {
    wordbanks: [],
    showDialog: false,
    newBankName: ''
  },

  onLoad: function() {
    this.fetchWordbanks();
  },

  onShow: function() {
    this.fetchWordbanks();
  },

  // 获取用户词库列表
  fetchWordbanks: function() {
    wx.showLoading({
      title: '加载中',
    });
    
    wx.cloud.callFunction({
      name: 'wordbank',
      data: {
        action: 'getWordbanks'
      }
    })
    .then(res => {
      const result = res.result;
      if (result.success) {
        this.setData({
          wordbanks: result.data
        });
      } else {
        wx.showToast({
          title: result.message || '获取词库失败',
          icon: 'none'
        });
      }
      wx.hideLoading();
    })
    .catch(err => {
      console.error('调用云函数失败', err);
      wx.hideLoading();
      wx.showToast({
        title: '获取词库失败',
        icon: 'none'
      });
    });
  },

  // 显示添加词库对话框
  showAddDialog: function() {
    this.setData({
      showDialog: true,
      newBankName: ''
    });
  },

  // 隐藏对话框
  hideDialog: function() {
    this.setData({
      showDialog: false
    });
  },

  // 阻止事件冒泡
  stopPropagation: function() {
    return;
  },

  // 监听输入
  onNameInput: function(e) {
    this.setData({
      newBankName: e.detail.value
    });
  },

  // 创建新词库
  createWordbank: function() {
    const name = this.data.newBankName.trim();
    
    if (!name) {
      wx.showToast({
        title: '请输入词库名称',
        icon: 'none'
      });
      return;
    }
    
    wx.showLoading({
      title: '创建中',
    });
    
    wx.cloud.callFunction({
      name: 'wordbank',
      data: {
        action: 'createWordbank',
        data: {
          name: name
        }
      }
    })
    .then(res => {
      wx.hideLoading();
      
      const result = res.result;
      if (result && result.success) {
        this.hideDialog();
        
        // 跳转到添加词汇页面
        wx.navigateTo({
          url: `/pages/wordbank-add/wordbank-add?id=${result.data._id}&name=${result.data.name}`
        });
        
        // 刷新词库列表
        this.fetchWordbanks();
      } else {
        let errorMsg = '创建失败';
        if (result && result.message) {
          errorMsg = result.message;
        } else if (res.errMsg) {
          errorMsg = res.errMsg;
        }
        
        wx.showToast({
          title: errorMsg,
          icon: 'none',
          duration: 2000
        });
      }
    })
    .catch(err => {
      wx.hideLoading();
      
      let errorMsg = '创建词库失败';
      
      if (err.errMsg) {
        errorMsg += ': ' + err.errMsg;
      }
      
      wx.showToast({
        title: errorMsg,
        icon: 'none',
        duration: 3000
      });
    });
  },

  // 跳转到词库详情
  goToDetail: function(e) {
    const { id, name } = e.currentTarget.dataset;
    wx.navigateTo({
      url: `/pages/wordbank-detail/wordbank-detail?id=${id}&name=${name}`
    });
  }
}); 