// 学习页面逻辑
Page({
  data: {
    currentWord: {},
    options: [],
    score: 0,
    correctCount: 0,
    incorrectCount: 0
  },
  onLoad: function() {
    this.loadWord()
  },
  // 加载单词
  loadWord: function() {
    // 这里应该从数据库或API获取单词，这里使用模拟数据
    const word = {
      text: 'Example',
      meaning: '例子'
    }
    const options = this.generateOptions(word)
    this.setData({
      currentWord: word,
      options: options
    })
  },
  // 生成选项
  generateOptions: function(word) {
    const correctAnswer = word.meaning
    const options = [correctAnswer]
    while (options.length < 4) {
      const wrongAnswer = `错误选项${options.length}`
      if (options.indexOf(wrongAnswer) === -1) {
        options.push(wrongAnswer)
      }
    }
    return this.shuffleArray(options)
  },
  // 打乱数组顺序
  shuffleArray: function(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]]
    }
    return array
  },
  // 选择答案
  selectAnswer: function(e) {
    const selectedAnswer = e.currentTarget.dataset.option
    const correctAnswer = this.data.currentWord.meaning
    if (selectedAnswer === correctAnswer) {
      this.setData({
        score: this.data.score + 1,
        correctCount: this.data.correctCount + 1
      })
    } else {
      this.setData({
        incorrectCount: this.data.incorrectCount + 1
      })
    }
    setTimeout(() => {
      this.loadWord()
    }, 1000)
  },
  // 保存得分
  saveScore: function() {
    const score = this.data.score
    wx.setStorageSync('userScore', score)
  }
})
