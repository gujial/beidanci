const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()
const $ = db.command.aggregate

exports.main = async (event, context) => {
  const openid = cloud.getWXContext().OPENID

  try {
    // 聚合分数并联表用户信息
    const aggRes = await db.collection('score')
      .aggregate()
      .group({
        _id: '$_openid',
        totalScore: $.sum('$score')
      })
      .lookup({
        from: 'users',
        localField: '_openid',
        foreignField: '_openid',
        as: 'userInfo'
      })
      .sort({ totalScore: -1 })
      .limit(100)
      .end()

    const leaderboard = aggRes.list.map((item, index) => ({
      openid: item._id,
      score: item.totalScore,
      nickname: item.userInfo[0]?.nickName || '匿名用户',
      avatarUrl: item.userInfo[0]?.avatarUrl || '/images/default-avatar.png',
      rank: index + 1
    }))

    // 查找当前用户在排行榜中的位置
    const self = leaderboard.find(item => item.openid === openid) || {}

    return {
      success: true,
      leaderboard,
      self
    }
  } catch (err) {
    console.error(err)
    return {
      success: false,
      error: err.message
    }
  }
}
