const cloud = require('wx-server-sdk')
cloud.init({
    env: cloud.DYNAMIC_CURRENT_ENV
})
const db = cloud.database()

exports.main = async (event, context) => {
    const wxContext = cloud.getWXContext()
    const openid = wxContext.OPENID

    const {
        level, // cet4 或 cet6（可选）
        keyword, // 搜索关键字（可选）
        startTime, // 起始时间戳（可选）
        endTime, // 结束时间戳（可选）
        limit = 20, // 默认分页大小
        skip = 0 // 默认从第几条开始
    } = event

    try {
        const whereClause = {
            _openid: openid
        }

        if (level) {
            whereClause.level = level
        }

        if (keyword && keyword.trim()) {
            whereClause.word = db.RegExp({
                regexp: keyword.trim(),
                options: 'i' // 不区分大小写
            })
        }

        if (startTime || endTime) {
            whereClause.timestamp = {}
            if (startTime) {
                whereClause.timestamp.$gte = new Date(startTime)
            }
            if (endTime) {
                whereClause.timestamp.$lte = new Date(endTime)
            }
        }

        const historyRes = await db.collection('learnHistory')
            .where(whereClause)
            .orderBy('timestamp', 'desc')
            .skip(skip)
            .limit(limit)
            .get()

        return {
            success: true,
            data: historyRes.data
        }

    } catch (err) {
        console.error('获取学习记录失败:', err)
        return {
            success: false,
            error: err.message
        }
    }
}