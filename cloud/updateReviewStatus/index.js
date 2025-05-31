const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event, context) => {
  const { openid } = cloud.getWXContext();
  const { wordId, isCorrect } = event;

  try {
    // 1. 查询单词记录
    const word = await db.collection('wordReview')
      .where({ _openid: openid, _id: wordId })
      .get()
      .then(res => res.data[0]);

    if (!word) {
      return { success: false, error: '单词记录不存在' };
    }

    // 2. 计算新权重
    let newWeight;
    if (isCorrect) {
      newWeight = Math.max(word.weight - 1, 0); // 答对：权重减1，最低0
    } else {
      newWeight = 4; // 答错：重置为4
    }

    // 3. 更新状态
    await db.collection('wordReview').doc(wordId).update({
      data: {
        weight: newWeight,
        isWaitReview: false, // 复习后移出队列，等待下次定时触发
        timestamp: db.serverDate() // 记录复习时间
      }
    });

    return { success: true, newWeight };

  } catch (error) {
    console.error('更新复习状态失败:', error);
    return { success: false, error: '更新失败' };
  }
};