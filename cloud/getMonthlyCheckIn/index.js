// 云函数入口文件
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID

  const now = new Date()
  const year = now.getFullYear()
  const month = (now.getMonth() + 1).toString().padStart(2, '0')  // "05"

  const monthPrefix = `${year}-${month}` // "2025-05"

  try {
    const res = await db.collection('checkIn')
      .where({
        _openid: openid,
        date: db.RegExp({
          regexp: `^${monthPrefix}`,
          options: 'i'
        })
      })
      .get()

    const checkedDates = res.data.map(item => item.date)

    return {
      success: true,
      data: checkedDates
    }
  } catch (err) {
    return {
      success: false,
      message: '获取本月打卡记录失败',
      error: err
    }
  }
}
