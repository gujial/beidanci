// 云函数 getLearnStats
const cloud = require('wx-server-sdk')
cloud.init({
    env: cloud.DYNAMIC_CURRENT_ENV
})
const db = cloud.database()

exports.main = async (event, context) => {
    const openid = cloud.getWXContext().OPENID
    const $ = db.command.aggregate

    try {
        // 1. 查询打卡连续天数
        const checkInRes = await db.collection('checkIn')
            .where({ _openid: openid })
            .get()
        const streak = checkInRes.data[0]?.streak || 0

        // 2. 查询得分总数和测试次数
        const scoreAgg = await db.collection('score')
            .aggregate()
            .match({ _openid: openid })
            .group({
                _id: null,
                totalScore: $.sum('$score'),
                times: $.sum(1)
            })
            .end()

        const totalScore = scoreAgg.list[0]?.totalScore || 0
        const totalTests = scoreAgg.list[0]?.times || 0

        // 3. 查询每日学习词数
        const learnAgg = await db.collection('learnHistory')
            .aggregate()
            .match({ _openid: openid })
            .project({
                date: $.dateToString({
                    date: '$timestamp',
                    format: '%Y-%m-%d',
                    timezone: '+08:00'
                })
            })
            .group({
                _id: '$date',
                count: $.sum(1)
            })
            .sort({ _id: -1 })
            .end()

        // 4. 按词库统计学习数量（byLevel）
        const byLevelAgg = await db.collection('learnHistory')
            .aggregate()
            .match({ _openid: openid })
            .group({
                _id: '$level',
                count: $.sum(1)
            })
            .end()

        // 转换为对象格式：{ cet4: 50, cet6: 30 }
        const byLevel = {}
        byLevelAgg.list.forEach(item => {
            if (item._id) {
                byLevel[item._id] = item.count
            }
        })

        // 返回结果
        return {
            success: true,
            data: {
                streak,
                totalScore,
                totalTests,
                dailyCounts: learnAgg.list,
                byLevel
            }
        }

    } catch (err) {
        return {
            success: false,
            error: err.message
        }
    }
}
