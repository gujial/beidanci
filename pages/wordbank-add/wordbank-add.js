Page({
  data: {
    inputText: '',
    wordbankId: '',
    wordbankName: ''
  },

  onLoad: function(options) {
    if (options.id && options.name) {
      this.setData({
        wordbankId: options.id,
        wordbankName: options.name
      });
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

  // 监听文本输入
  onTextInput: function(e) {
    this.setData({
      inputText: e.detail.value
    });
  },

  // 识别文本并添加单词
  recognizeWords: function() {
    const text = this.data.inputText.trim();
    
    if (!text) {
      wx.showToast({
        title: '请输入文本',
        icon: 'none'
      });
      return;
    }
    
    // 解析文本
    const words = this.parseText(text);
    
    if (words.length === 0) {
      wx.showToast({
        title: '未识别到有效单词',
        icon: 'none'
      });
      return;
    }
    
    wx.showLoading({
      title: '添加中...',
    });
    
    // 创建集合名称（使用词库ID作为集合名）
    const collectionName = `wordbank_${this.data.wordbankId}`;
    
    // 添加单词到数据库
    this.addWordsToDatabase(words, collectionName)
      .then(() => {
        // 更新词库的单词数量
        return this.updateWordbankCount(words.length);
      })
      .then(() => {
        wx.hideLoading();
        wx.showToast({
          title: `成功添加${words.length}个单词`,
          icon: 'success'
        });
        
        // 清空输入框
        this.setData({
          inputText: ''
        });
        
        // 延迟返回词库详情页
        setTimeout(() => {
          wx.navigateBack();
        }, 1500);
      })
      .catch(err => {
        console.error('添加单词失败', err);
        wx.hideLoading();
        wx.showToast({
          title: '添加失败',
          icon: 'none'
        });
      });
  },

  // 解析文本，提取单词和释义
  parseText: function(text) {
    const lines = text.split('\n');
    const words = [];
    
    const englishWordRegex = /^[a-zA-Z]+$/;
    
    for (let line of lines) {
      // 跳过空行
      if (!line.trim()) continue;
      
      // 尝试按空格或Tab分割
      let parts = line.trim().split(/\s+|\t+/);
      
      // 至少需要两部分：单词和释义
      if (parts.length >= 2) {
        const word = parts[0].trim();
        
        // 检查单词是否为纯英文
        if (!englishWordRegex.test(word)) continue;
        
        // 释义为剩余部分
        const translate = parts.slice(1).join(' ').trim();
        
        // 如果释义中包含空格，则不符合要求
        if (translate.includes(' ')) continue;
        
        words.push({
          word,
          translate
        });
      }
    }
    
    return words;
  },

  // 添加单词到数据库
  addWordsToDatabase: function(words, collectionName) {
    const db = wx.cloud.database();
    
    // 检查集合是否存在，不存在则创建
    return new Promise((resolve, reject) => {
      const addPromises = words.map(wordObj => {
        return db.collection(collectionName).add({
          data: {
            word: wordObj.word,
            translate: wordObj.translate,
            createTime: db.serverDate()
          }
        });
      });
      
      Promise.all(addPromises)
        .then(() => {
          resolve();
        })
        .catch(err => {
          reject(err);
        });
    });
  },

  // 更新词库的单词数量
  updateWordbankCount: function(addedCount) {
    const db = wx.cloud.database();
    
    return db.collection('wordbanks').doc(this.data.wordbankId).update({
      data: {
        wordCount: db.command.inc(addedCount)
      }
    });
  }
}); 