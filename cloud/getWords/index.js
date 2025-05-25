const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

// 工具函数：打乱数组顺序
function shuffleArray(array) {
  const arr = array.slice()
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()

  // 从参数中获取词库类型：cet4 或 cet6
  const level = event.level
  const collectionName = level === 'cet6' ? 'beidanci_cet6' : 'beidanci_cet4'

  try {
    // 获取该集合的总记录数
    const countResult = await db.collection(collectionName).count()
    const total = countResult.total

    // 随机选取一个作为正确词汇
    const randomIndex = Math.floor(Math.random() * total)
    const correctRes = await db.collection(collectionName).skip(randomIndex).limit(1).get()
    const correct = correctRes.data[0]

    // 获取三个错误释义
    let distracts = []
    while (distracts.length < 3) {
      const idx = Math.floor(Math.random() * total)
      const res = await db.collection(collectionName).skip(idx).limit(1).get()
      const word = res.data[0]

      if (word.translate !== correct.translate && !distracts.find(d => d.translate === word.translate)) {
        distracts.push(word)
      }
    }

    // 构建选项并打乱顺序
    const choices = [...distracts.map(d => d.translate), correct.translate]
    const shuffledChoices = shuffleArray(choices)
    const correctIndex = shuffledChoices.indexOf(correct.translate)

    return {
      word: correct.word,
      choices: shuffledChoices,
      correctIndex, // 前端可以根据这个索引判断正确答案
      openid: wxContext.OPENID,
    }
  } catch (error) {
    console.error('云函数错误:', error)
    return {
      error: '获取单词数据失败',
      details: error.message,
    }
  }
}
