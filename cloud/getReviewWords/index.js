const cloud = require('wx-server-sdk')
cloud.init({
    env: cloud.DYNAMIC_CURRENT_ENV
})
const db = cloud.database()
const _ = db.command

// 工具函数：数组洗牌
function shuffleArray(array) {
    const arr = array.slice();
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

exports.main = async (event, context) => {
    const wxContext = cloud.getWXContext()
    const openid = wxContext.OPENID
    const level = event.level

    try {
        // 1. 查询待复习单词（isWaitReview=true，weight>0）
        const reviewList = await db.collection('wordReview')
            .where({
                _openid: openid,
                level: level,
                isWaitReview: true,
                weight: _.gt(0) // 排除权重为0的单词
            })
            .orderBy('timestamp', 'asc') // 最早该复习的单词优先
            .get();

        if (!reviewList.data || reviewList.data.length === 0) {
            return {
                success: true,
                data: []
            }; // 无待复习单词
        }

        // 2. 随机排序单词
        const shuffledWords = shuffleArray(reviewList.data);

        // 3. 为第一个单词生成干扰项（示例取第一个单词，可扩展分页）
        const targetWord = shuffledWords[0];
        const distracts = await getDistracts(targetWord, level);

        // 4. 生成选项
        const choices = shuffleArray([...distracts, targetWord.translate]);
        const correctIndex = choices.indexOf(targetWord.translate);

        return {
            success: true,
            data: {
                _id: targetWord._id,
                word: targetWord.word,
                choices: choices,
                correctIndex: correctIndex,
                weight: targetWord.weight,

            }
        };

    } catch (error) {
        console.error('获取复习单词失败:', error);
        return {
            success: false,
            error: '获取复习单词失败'
        };
    }
};
// 辅助函数：获取干扰项（从同级别词库随机取3个不同释义的单词）
async function getDistracts(targetWord, level) {
    if (!targetWord?.translate) return [];  // 检查目标单词是否有翻译

    const collectionName = level === 'cet6' ? 'beidanci_cet6' : 'beidanci_cet4';
    const distracts = new Set();

    // 限制重试次数，避免无限循环
    let retry = 0;
    while (distracts.size < 3 && retry < 10) {
        const countRes = await db.collection(collectionName).count();
        const total = countRes.total;
        if (total === 0) break;

        const randomWord = await db.collection(collectionName)
            .skip(Math.floor(Math.random() * total))
            .limit(1)
            .get();

        if (randomWord.data[0]?.translate && randomWord.data[0].translate !== targetWord.translate) {
            distracts.add(randomWord.data[0].translate);
        }
        retry++;
    }
    return [...distracts];
}