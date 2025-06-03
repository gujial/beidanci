// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
    env: cloud.DYNAMIC_CURRENT_ENV
}) // 使用当前云环境

// 云函数入口函数
exports.main = async (event) => {
    const wxContext = cloud.getWXContext();

    // 1、初始化数据库（获取数据库的引用）
    const db = cloud.database();
    // 2、指定集合（数据表），获取集合的引用
    const users = db.collection("users");

    // 3、先查询当前用户是否已注册过
    const { data } = await users
      .where({
        _openid: wxContext.OPENID,
      })
      .get();

    // 判断是否已存在该用户
    if (data.length === 0) {
      // 数据库中没有当前用户的信息，返回错误提示
      return {
        code: 1,
        msg: "账号不存在，请先注册",
        data: null
      };
    } else {
      // 数据库中存在当前用户的信息（已注册过），则直接返回当前用户信息（登录）
      return {
        code: 0,
        msg: "登录成功",
        data: data[0],
      };
    }
};