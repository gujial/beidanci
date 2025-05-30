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
            
        // 处理用户自定义词库名称
        const userBankIds = [];
        historyRes.data.forEach(item => {
            if (item.level && item.level.startsWith('user_')) {
                const bankId = item.level.substring(5); // 移除'user_'前缀
                userBankIds.push(bankId);
            }
        });
        
        // 如果有用户词库记录，查询词库名称
        const userWordbanks = {};
        if (userBankIds.length > 0) {
            const wordbanksRes = await db.collection('wordbanks')
                .where({
                    _id: db.command.in([...new Set(userBankIds)])  // 去重
                })
                .get();
            
            // 创建ID到名称的映射
            wordbanksRes.data.forEach(bank => {
                userWordbanks[bank._id] = bank.name;
            });
        }
        
        // 处理查询结果，添加词库名称字段
        const processedData = historyRes.data.map(item => {
            const result = { ...item };
            if (item.level && item.level.startsWith('user_')) {
                const bankId = item.level.substring(5);
                result.levelName = userWordbanks[bankId] || `未知词库(${bankId})`;
            } else if (item.level === 'cet4') {
                result.levelName = 'CET-4';
            } else if (item.level === 'cet6') {
                result.levelName = 'CET-6';
            } else {
                result.levelName = item.level;
            }
            return result;
        });

        return {
            success: true,
            data: processedData
        }

    } catch (err) {
        console.error('获取学习记录失败:', err)
        return {
            success: false,
            error: err.message
        }
    }
}