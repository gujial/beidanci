Page({
  data: {
    inputText: '',
    wordbankId: '',
    wordbankName: '',
    textareaFocus: true
  },

  onLoad: function(options) {
    if (options.id && options.name) {
      this.setData({
        wordbankId: options.id,
        wordbankName: options.name
      });

      // 设置导航栏标题为词库名称
      wx.setNavigationBarTitle({
        title: `添加单词 - ${options.name}`
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

  // 设置输入框焦点
  setTextareaFocus: function() {
    this.setData({
      textareaFocus: true
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
    
    // 调用云函数添加单词
    wx.cloud.callFunction({
      name: 'wordbank',
      data: {
        action: 'addWords',
        data: {
          wordbankId: this.data.wordbankId,
          words: words
        }
      }
    })
    .then(res => {
      const result = res.result;
      if (result.success) {
        wx.hideLoading();
        wx.showToast({
          title: `成功添加${result.count}个单词`,
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
      } else {
        wx.hideLoading();
        wx.showToast({
          title: result.message || '添加失败',
          icon: 'none'
        });
      }
    })
    .catch(err => {
      console.error('调用云函数失败', err);
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
    let validCount = 0;
    let totalCount = 0;
    
    for (let line of lines) {
      // 跳过空行
      if (!line.trim()) continue;
      
      totalCount++;
      
      // 尝试按空格或Tab分割
      let parts = line.trim().split(/\s+|\t+/);
      
      // 至少需要两部分：单词和释义
      if (parts.length >= 2) {
        const word = parts[0].trim();
        
        // 检查单词是否为纯英文
        if (!englishWordRegex.test(word)) continue;
        
        // 释义为第二部分，不允许内部有空格
        const translate = parts[1].trim();
        
        // 如果单词或释义为空，则跳过
        if (!word || !translate) continue;
        
        words.push({
          word,
          translate
        });
        
        validCount++;
      }
    }
    
    // 如果有解析失败的行，给出提示
    if (totalCount > 0 && validCount < totalCount) {
      wx.showToast({
        title: `已解析 ${validCount}/${totalCount} 行`,
        icon: 'none',
        duration: 2000
      });
    }
    
    return words;
  }
}); 