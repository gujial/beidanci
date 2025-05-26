// 云函数入口文件
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID

  try {
    const result = await db.collection('checkIn')
      .where({ _openid: openid })
      .orderBy('date', 'desc') // 倒序排列（最近的在上）
      .limit(100) // 最多获取最近 100 条
      .get()

    return {
      success: true,
      data: result.data
    }
  } catch (err) {
    return {
      success: false,
      message: '获取打卡历史失败',
      error: err
    }
  }
}
