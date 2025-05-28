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

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID

  const level = event.level || 'cet4'
  const userBankId = event.userBankId // 用户自定义词库ID

  try {
    let correct, distracts, collectionName
    
    // 判断是系统词库还是用户自定义词库
    if (level === 'user' && userBankId) {
      // 用户自定义词库
      const userBank = await db.collection('wordbanks').doc(userBankId).get()
      
      if (!userBank.data || !userBank.data.words || userBank.data.words.length === 0) {
        return {
          error: '词库为空或不存在'
        }
      }
      
      const words = userBank.data.words
      // 检查词库是否至少有1个单词
      if (words.length < 1) {
        return {
          error: '词库中单词数量不足'
        }
      }

      // 随机选择一个单词作为正确答案
      const randomIndex = Math.floor(Math.random() * words.length)
      correct = words[randomIndex]
      
      // 从剩余单词中选择干扰项
      distracts = []
      const availableWords = words.filter((_, idx) => idx !== randomIndex)
      
      // 如果词库单词不足4个，则重复使用词库中已有的单词作为干扰项
      // 而不是从系统词库中获取
      while (distracts.length < 3) {
        if (availableWords.length === 0) {
          // 如果没有其他单词可选，则使用随机翻译作为干扰项
          const fakeTrans = ['选项A', '选项B', '选项C']
          const remainingNeeded = 3 - distracts.length
          
          for (let i = 0; i < remainingNeeded; i++) {
            // 确保这些伪选项不与正确答案或已有干扰项重复
            let fakeOption = {
              word: `fake_${i}`,
              translate: fakeTrans[i % 3] + (i + 1)
            }
            
            // 确保伪选项不与正确答案相同
            if (fakeOption.translate === correct.translate) {
              fakeOption.translate += '_alt'
            }
            
            distracts.push(fakeOption)
          }
          break
        }
        
        const distIdx = Math.floor(Math.random() * availableWords.length)
        const word = availableWords[distIdx]
        
        if (!distracts.find(d => d.translate === word.translate)) {
          distracts.push(word)
          
          // 移除已使用的干扰项，除非词库太小
          if (availableWords.length > 3) {
            availableWords.splice(distIdx, 1)
          }
        }
      }
      
      // 创建学习记录
      await db.collection('learnHistory').add({
        data: {
          _openid: openid,
          word: correct.word,
          translate: correct.translate,
          level: 'user_' + userBankId, // 使用前缀标识用户词库
          timestamp: db.serverDate()
        }
      })
    } else {
      // 系统预设词库
      collectionName = level === 'cet6' ? 'beidanci_cet6' : 'beidanci_cet4'
      
      // 获取集合总数
      const countResult = await db.collection(collectionName).count()
      const total = countResult.total
      
      // 获取正确单词
      const randomIndex = Math.floor(Math.random() * total)
      const correctRes = await db.collection(collectionName).skip(randomIndex).limit(1).get()
      correct = correctRes.data[0]
      
      // 获取三个干扰项
      distracts = []
      while (distracts.length < 3) {
        const idx = Math.floor(Math.random() * total)
        const res = await db.collection(collectionName).skip(idx).limit(1).get()
        const word = res.data[0]
        
        if (word.translate !== correct.translate && !distracts.find(d => d.translate === word.translate)) {
          distracts.push(word)
        }
      }
      
      // 创建学习记录
      await db.collection('learnHistory').add({
        data: {
          _openid: openid,
          word: correct.word,
          translate: correct.translate,
          level,
          timestamp: db.serverDate()
        }
      })
    }

    const choices = [...distracts.map(d => d.translate), correct.translate]
    const shuffledChoices = shuffleArray(choices)
    const correctIndex = shuffledChoices.indexOf(correct.translate)

    return {
      word: correct.word,
      choices: shuffledChoices,
      correctIndex,
      openid,
      isUserBank: level === 'user'
    }

  } catch (error) {
    console.error('云函数错误:', error)
    return {
      error: '获取单词数据失败',
      details: error.message
    }
  }
}
