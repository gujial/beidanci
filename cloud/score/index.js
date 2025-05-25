// 云函数入口文件
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境
const db = cloud.database()

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const { score } = event
  const openid = wxContext.OPENID
  const users = db.collection('score')

  if (typeof score !== 'number' || score <= 0) {
    return { success: false, message: '无效的分数' }
  }

  try {
    // 查找是否已有记录
    const res = await users.where({ _openid: openid }).get()

    if (res.data.length > 0) {
      // 已有记录，更新分数
      await users.where({ _openid: openid }).update({
        data: {
          score: db.command.inc(score)
        }
      })
    } else {
      // 没有记录，新建用户记录
      await users.add({
        data: {
          _openid: openid,
          score: score
        }
      })
    }

    return {
      success: true,
      newScoreAdded: score
    }
  } catch (err) {
    return {
      success: false,
      message: '数据库更新失败',
      error: err
    }
  }
}
