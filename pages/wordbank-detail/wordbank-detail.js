Page({
  data: {
    wordbankId: '',
    wordbankName: '',
    words: [],
    page: 1,
    pageSize: 20,
    hasMore: true
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
    if (!this.data.hasMore) return;
    
    const db = wx.cloud.database();
    const collectionName = `wordbank_${this.data.wordbankId}`;
    const skip = (this.data.page - 1) * this.data.pageSize;
    
    wx.showLoading({
      title: '加载中',
    });
    
    db.collection(collectionName)
      .skip(skip)
      .limit(this.data.pageSize)
      .orderBy('createTime', 'desc')
      .get()
      .then(res => {
        const newWords = res.data;
        
        this.setData({
          words: this.data.words.concat(newWords),
          page: this.data.page + 1,
          hasMore: newWords.length === this.data.pageSize
        });
        
        wx.hideLoading();
      })
      .catch(err => {
        console.error('获取单词失败', err);
        wx.hideLoading();
        wx.showToast({
          title: '获取单词失败',
          icon: 'none'
        });
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
    const db = wx.cloud.database();
    const collectionName = `wordbank_${this.data.wordbankId}`;
    
    wx.showLoading({
      title: '删除中',
    });
    
    db.collection(collectionName)
      .doc(id)
      .remove()
      .then(() => {
        // 更新本地数据
        const words = this.data.words.slice();
        words.splice(index, 1);
        
        this.setData({
          words
        });
        
        // 更新词库单词数量
        return db.collection('wordbanks').doc(this.data.wordbankId).update({
          data: {
            wordCount: db.command.inc(-1)
          }
        });
      })
      .then(() => {
        wx.hideLoading();
        wx.showToast({
          title: '删除成功',
          icon: 'success'
        });
      })
      .catch(err => {
        console.error('删除单词失败', err);
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
  }
}); 