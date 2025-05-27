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
    const db = wx.cloud.database();
    const _ = db.command;
    
    wx.showLoading({
      title: '加载中',
    });
    
    db.collection('wordbanks')
      .where({
        _openid: '{openid}' // 自动替换为当前用户openid
      })
      .get()
      .then(res => {
        this.setData({
          wordbanks: res.data
        });
        wx.hideLoading();
      })
      .catch(err => {
        console.error('获取词库失败', err);
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
    
    const db = wx.cloud.database();
    
    // 检查是否已存在同名词库
    db.collection('wordbanks')
      .where({
        _openid: '{openid}',
        name: name
      })
      .count()
      .then(res => {
        if (res.total > 0) {
          wx.hideLoading();
          wx.showToast({
            title: '已存在同名词库',
            icon: 'none'
          });
          return;
        }
        
        // 创建新词库
        return db.collection('wordbanks').add({
          data: {
            name: name,
            createTime: db.serverDate(),
            wordCount: 0
          }
        });
      })
      .then(res => {
        if (res && res._id) {
          wx.hideLoading();
          this.hideDialog();
          
          // 跳转到添加词汇页面
          wx.navigateTo({
            url: `/pages/wordbank-add/wordbank-add?id=${res._id}&name=${name}`
          });
          
          // 刷新词库列表
          this.fetchWordbanks();
        }
      })
      .catch(err => {
        console.error('创建词库失败', err);
        wx.hideLoading();
        wx.showToast({
          title: '创建失败',
          icon: 'none'
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