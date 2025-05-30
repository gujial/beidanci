const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command

// 遗忘曲线权重对应的间隔天数（从学习/复习时间开始计算）
const WEIGHT_INTERVALS = { 4: 2, 3: 7, 2: 15, 1: 30 }

// 工具函数：生成不重复的随机索引数组
function getUniqueRandomIndices(total, count) {
  const indices = new Set()
  while (indices.size < count) {
    indices.add(Math.floor(Math.random() * total))
  }
  return [...indices]
}

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  const { level = 'cet4', pageSize = 10 } = event

  try {
    // 1. 查询符合条件的待复习单词（isWaitReview=true且达到时间）
    const now = new Date()
    const reviewList = await db.collection('wordReview')
      .where({
        _openid: openid,
        level: level,
        isWaitReview: true,
        weight: _.in([4, 3, 2, 1]), // 只处理有效权重
        timestamp: _.lte( // 检查是否超过复习间隔时间
          new Date(now.getTime() - WEIGHT_INTERVALS[4] * 24 * 60 * 60 * 1000)
        )
      })
      .get()

    if (reviewList.data.length === 0) {
      return { success: true, data: [] }
    }

    // 2. 随机排序待复习单词（避免固定顺序记忆）
    const shuffledWords = shuffleArray(reviewList.data)
    
    // 3. 为每个单词生成3个干扰项（从同级别词库获取）
    const result = []
    const collectionName = level === 'cet6' ? 'beidanci_cet6' : 'beidanci_cet4'
    
    for (const word of shuffledWords.slice(0, pageSize)) {
      const distractIndices = getUniqueRandomIndices(
        reviewList.data.length, // 从复习列表中取干扰项（也可从原词库取）
        3
      )
      
      // 获取干扰项（优先从复习列表中随机选取，避免跨集合查询）
      const distracts = distractIndices.map(idx => 
        reviewList.data[idx].translate
      ).filter(d => d !== word.translate)
      
      // 如果复习列表中干扰项不足，从原词库补充
      while (distracts.length < 3) {
        const res = await db.collection(collectionName)
          .skip(Math.floor(Math.random() * await db.collection(collectionName).count()))
          .limit(1)
          .get()
        const d = res.data[0].translate
        if (d !== word.translate && !distracts.includes(d)) {
          distracts.push(d)
        }
      }

      // 生成选项并打乱顺序
      const choices = shuffleArray([...distracts, word.translate])
      const correctIndex = choices.indexOf(word.translate)
      
      result.push({
        _id: word._id,
        word: word.word,
        translate: word.translate,
        choices,
        correctIndex,
        weight: word.weight,
        level: word.level
      })
    }

    return {
      success: true,
      data: result,
      total: shuffledWords.length,
      pageSize
    }

  } catch (error) {
    console.error('复习单词获取失败:', error)
    return {
      success: false,
      error: '获取复习单词失败',
      details: error.message
    }
  }
}

// 工具函数：数组洗牌
function shuffleArray(array) {
  const arr = array.slice()
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    [arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}