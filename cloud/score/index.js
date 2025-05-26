const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) 
const db = cloud.database()

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const { score } = event
  const openid = wxContext.OPENID
  const scoreCollection = db.collection('score')

  if (typeof score !== 'number' || score <= 0) {
    return { success: false, message: '无效的分数' }
  }

  try {
    // 直接新增一条得分记录
    await scoreCollection.add({
      data: {
        _openid: openid,
        score: score,
        timestamp: db.serverDate()
      }
    })

    return {
      success: true,
      newScoreAdded: score
    }
  } catch (err) {
    return {
      success: false,
      message: '数据库更新失败',
      error: err.message
    }
  }
}
