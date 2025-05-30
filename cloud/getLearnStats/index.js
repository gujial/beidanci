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
        
        // 获取用户词库映射表
        const userWordbanks = {}
        const userBankIds = []
        
        // 提取所有用户词库ID
        byLevelAgg.list.forEach(item => {
            if (item._id && item._id.startsWith('user_')) {
                const bankId = item._id.substring(5) // 移除'user_'前缀
                userBankIds.push(bankId)
            }
        })
        
        // 如果有用户词库，查询词库名称
        if (userBankIds.length > 0) {
            const wordbanksRes = await db.collection('wordbanks')
                .where({
                    _id: db.command.in(userBankIds)
                })
                .get()
            
            // 创建ID到名称的映射
            wordbanksRes.data.forEach(bank => {
                userWordbanks[bank._id] = bank.name
            })
        }
        
        // 处理统计数据，将用户词库ID转换为名称
        byLevelAgg.list.forEach(item => {
            if (item._id) {
                if (item._id.startsWith('user_')) {
                    const bankId = item._id.substring(5)
                    const bankName = userWordbanks[bankId] || `未知词库(${bankId})`
                    byLevel[bankName] = item.count
                } else {
                    byLevel[item._id] = item.count
                }
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
