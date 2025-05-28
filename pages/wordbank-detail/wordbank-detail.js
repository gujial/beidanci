Page({
  data: {
    wordbankId: '',
    wordbankName: '',
    words: [],
    page: 1,
    pageSize: 20,
    hasMore: true,
    loading: false
  },

  onLoad: function(options) {
    if (options.id && options.name) {
      this.setData({
        wordbankId: options.id,
        wordbankName: options.name
      });
      this.loadWords();
    } else {
      wx.showToast({
        title: '参数错误',
        icon: 'none'
      });
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
    }
  },

  onShow: function() {
    // 每次显示页面时刷新数据
    if (this.data.wordbankId) {
      this.setData({
        page: 1,
        words: [],
        hasMore: true
      });
      this.loadWords();
    }
  },

  // 加载单词列表
  loadWords: function() {
    if (!this.data.hasMore || this.data.loading) return;
    
    this.setData({ loading: true });
    
    wx.showLoading({
      title: '加载中',
    });
    
    wx.cloud.callFunction({
      name: 'wordbank',
      data: {
        action: 'getWords',
        data: {
          wordbankId: this.data.wordbankId,
          page: this.data.page,
          pageSize: this.data.pageSize
        }
      }
    })
    .then(res => {
      const result = res.result;
      if (result.success) {
        const newWords = result.data;
        
        this.setData({
          words: this.data.words.concat(newWords),
          page: this.data.page + 1,
          hasMore: result.hasMore
        });
      } else {
        wx.showToast({
          title: result.message || '获取单词失败',
          icon: 'none'
        });
      }
      wx.hideLoading();
      this.setData({ loading: false });
    })
    .catch(err => {
      console.error('调用云函数失败', err);
      wx.hideLoading();
      wx.showToast({
        title: '获取单词失败',
        icon: 'none'
      });
      this.setData({ loading: false });
    });
  },

  // 跳转到添加单词页面
  goToAdd: function() {
    wx.navigateTo({
      url: `/pages/wordbank-add/wordbank-add?id=${this.data.wordbankId}&name=${this.data.wordbankName}`
    });
  },

  // 删除单词
  deleteWord: function(e) {
    const { id, index } = e.currentTarget.dataset;
    
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这个单词吗？',
      success: res => {
        if (res.confirm) {
          this.performDelete(id, index);
        }
      }
    });
  },

  // 执行删除操作
  performDelete: function(id, index) {
    wx.showLoading({
      title: '删除中',
    });
    
    wx.cloud.callFunction({
      name: 'wordbank',
      data: {
        action: 'deleteWord',
        data: {
          wordbankId: this.data.wordbankId,
          wordId: id
        }
      }
    })
    .then(res => {
      const result = res.result;
      if (result.success) {
        // 更新本地数据
        const words = this.data.words.slice();
        words.splice(index, 1);
        
        this.setData({
          words
        });
        
        wx.showToast({
          title: '删除成功',
          icon: 'success'
        });
      } else {
        wx.showToast({
          title: result.message || '删除失败',
          icon: 'none'
        });
      }
      wx.hideLoading();
    })
    .catch(err => {
      console.error('调用云函数失败', err);
      wx.hideLoading();
      wx.showToast({
        title: '删除失败',
        icon: 'none'
      });
    });
  },

  // 触底加载更多
  onReachBottom: function() {
    if (this.data.hasMore) {
      this.loadWords();
    }
  },

  // 下拉刷新
  onPullDownRefresh: function() {
    this.setData({
      page: 1,
      words: [],
      hasMore: true
    });
    this.loadWords();
    wx.stopPullDownRefresh();
  }
}); 