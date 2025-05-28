// 云函数入口文件
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  const { action, data } = event

  // 根据action参数执行不同操作
  switch (action) {
    case 'getWordbanks':
      return await getWordbanks(openid)
    case 'createWordbank':
      return await createWordbank(openid, data)
    case 'getWords':
      return await getWords(openid, data)
    case 'addWords':
      return await addWords(openid, data)
    case 'deleteWord':
      return await deleteWord(openid, data)
    default:
      return {
        success: false,
        message: '未知操作'
      }
  }
}

// 获取用户词库列表
async function getWordbanks(openid) {
  try {
    const result = await db.collection('wordbanks')
      .where({
        _openid: openid
      })
      .get()
    
    return {
      success: true,
      data: result.data
    }
  } catch (err) {
    console.error('获取词库列表失败', err)
    return {
      success: false,
      message: '获取词库列表失败'
    }
  }
}

// 创建新词库
async function createWordbank(openid, data) {
  if (!data || !data.name) {
    return {
      success: false,
      message: '缺少词库名称'
    }
  }

  try {
    const result = await db.collection('wordbanks').add({
      data: {
        _openid: openid,
        name: data.name,
        create_time: db.serverDate(),
        words: []
      }
    })
    
    return {
      success: true,
      data: {
        _id: result._id,
        name: data.name
      }
    }
  } catch (err) {
    console.error('创建词库失败', err)
    return {
      success: false,
      message: '创建词库失败'
    }
  }
}

// 获取词库中的单词
async function getWords(openid, data) {
  if (!data || !data.wordbankId) {
    return {
      success: false,
      message: '缺少词库ID'
    }
  }

  try {
    const wordbank = await db.collection('wordbanks')
      .doc(data.wordbankId)
      .get()
    
    if (!wordbank.data || wordbank.data._openid !== openid) {
      return {
        success: false,
        message: '词库不存在或无权限访问'
      }
    }

    const words = wordbank.data.words || []
    const page = data.page || 1
    const pageSize = data.pageSize || 20
    const start = (page - 1) * pageSize
    const end = start + pageSize

    // 分页获取单词
    const pagedWords = words.slice(start, end)
    
    return {
      success: true,
      data: pagedWords,
      hasMore: end < words.length
    }
  } catch (err) {
    console.error('获取单词失败', err)
    return {
      success: false,
      message: '获取单词失败'
    }
  }
}

// 添加单词到词库
async function addWords(openid, data) {
  if (!data || !data.wordbankId || !data.words) {
    return {
      success: false,
      message: '参数不完整'
    }
  }

  try {
    // 获取当前词库
    const wordbank = await db.collection('wordbanks')
      .doc(data.wordbankId)
      .get()
    
    if (!wordbank.data || wordbank.data._openid !== openid) {
      return {
        success: false,
        message: '词库不存在或无权限访问'
      }
    }

    // 当前词库的单词
    const currentWords = wordbank.data.words || []
    
    // 需要添加的单词
    const newWords = data.words || []
    
    // 合并单词列表，去重
    const mergedWords = [...currentWords]
    let addedCount = 0
    
    for (const newWord of newWords) {
      // 检查单词是否已存在
      const exists = currentWords.some(w => 
        w.word.toLowerCase() === newWord.word.toLowerCase()
      )
      
      if (!exists) {
        mergedWords.push({
          word: newWord.word,
          translate: newWord.translate,
          _id: Date.now() + Math.random().toString(36).substr(2, 5) // 生成简单的唯一ID
        })
        addedCount++
      }
    }
    
    // 更新词库
    await db.collection('wordbanks')
      .doc(data.wordbankId)
      .update({
        data: {
          words: mergedWords
        }
      })
    
    return {
      success: true,
      count: addedCount
    }
  } catch (err) {
    console.error('添加单词失败', err)
    return {
      success: false,
      message: '添加单词失败'
    }
  }
}

// 从词库删除单词
async function deleteWord(openid, data) {
  if (!data || !data.wordbankId || !data.wordId) {
    return {
      success: false,
      message: '参数不完整'
    }
  }

  try {
    // 获取当前词库
    const wordbank = await db.collection('wordbanks')
      .doc(data.wordbankId)
      .get()
    
    if (!wordbank.data || wordbank.data._openid !== openid) {
      return {
        success: false,
        message: '词库不存在或无权限访问'
      }
    }

    // 当前词库的单词
    const currentWords = wordbank.data.words || []
    
    // 删除指定单词
    const updatedWords = currentWords.filter(word => word._id !== data.wordId)
    
    // 如果没有找到要删除的单词
    if (updatedWords.length === currentWords.length) {
      return {
        success: false,
        message: '单词不存在'
      }
    }
    
    // 更新词库
    await db.collection('wordbanks')
      .doc(data.wordbankId)
      .update({
        data: {
          words: updatedWords
        }
      })
    
    return {
      success: true
    }
  } catch (err) {
    console.error('删除单词失败', err)
    return {
      success: false,
      message: '删除单词失败'
    }
  }
} 