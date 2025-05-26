const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  const checkIn = db.collection('checkIn')

  const today = new Date()
  const dateStr = today.toISOString().split('T')[0]

  // 计算昨天的日期字符串
  const yesterday = new Date(today)
  yesterday.setDate(today.getDate() - 1)
  const yesterdayStr = yesterday.toISOString().split('T')[0]

  try {
    // 1. 查询今天是否已打卡
    const todayCheck = await checkIn.where({
      _openid: openid,
      date: dateStr
    }).get()

    if (todayCheck.data.length > 0) {
      return {
        success: true,
        checkedIn: true,
        streak: todayCheck.data[0].streak,
        message: '今天已打卡'
      }
    }

    // 2. 查询昨天是否打卡
    const yesterdayCheck = await checkIn.where({
      _openid: openid,
      date: yesterdayStr
    }).get()

    const newStreak = yesterdayCheck.data.length > 0
      ? (yesterdayCheck.data[0].streak || 1) + 1
      : 1

    // 3. 写入今天的打卡记录
    await checkIn.add({
      data: {
        _openid: openid,
        date: dateStr,
        timestamp: db.serverDate(),
        streak: newStreak
      }
    })

    return {
      success: true,
      checkedIn: false,
      streak: newStreak,
      message: '打卡成功',
      date: dateStr
    }
  } catch (error) {
    return {
      success: false,
      message: '打卡失败',
      error
    }
  }
}
