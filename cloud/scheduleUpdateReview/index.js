const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 初始化云开发环境
const db = cloud.database() // 获取数据库实例
const _ = db.command // 引入数据库命令，用于复杂操作

exports.main = async (event, context) => {
  // 获取用户上下文（包含openid）
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID // 用户唯一标识，确保数据隔离
}
// 权重对应的间隔天数（与需求一致）
const WEIGHT_INTERVALS = { 4: 2, 3: 7, 2: 15, 1: 30 };

exports.main = async () => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()); // 当前日期零点

  // 查询所有需要更新状态的单词：
  // 1. weight > 0（权重为0不再处理）
  // 2. isWaitReview=false（未在复习队列）
  // 3. timestamp + 间隔天数 ≤ 今天
  const wordsToUpdate = await db.collection('wordReview')
    .where({
      _openid: openid,
      weight: _.in([4, 3, 2, 1]), // 有效权重
      isWaitReview: false,
      timestamp: _.lte( // 计算是否超过间隔时间
        new Date(today.getTime() - WEIGHT_INTERVALS[4] * 24 * 60 * 60 * 1000)
      )
    })
    .get();

  const updatePromises = [];
  for (const word of wordsToUpdate.data) {
    const { weight, timestamp } = word;
    const nextReviewDate = new Date(timestamp);
    nextReviewDate.setDate(nextReviewDate.getDate() + WEIGHT_INTERVALS[weight]); // 计算下次复习日期

    if (nextReviewDate <= today) { // 到达复习时间，标记为可复习
      updatePromises.push(
        db.collection('wordReview')
          .doc(word._id)
          .update({ data: { isWaitReview: true } })
      );
    }
  }

  // 批量更新（最多100条/次）
  await Promise.all(updatePromises.slice(0, 100));
  return { success: true, updatedCount: updatePromises.length };
};