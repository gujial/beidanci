// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const { avatarUrl, nickName } = event;
  const db = cloud.database();
  const users = db.collection("users");

  // 检查是否已注册
  const { data } = await users.where({
    _openId: wxContext.OPENID,
  }).get();

  if (data.length > 0) {
    return {
      code: 2,
      msg: "账号已存在，请直接登录",
      data: data[0]
    };
  }

  // 新增用户
  await users.add({
    data: {
      _openId: wxContext.OPENID,
      avatarUrl,
      nickName,
      createTime: new Date()
    }
  });

  return {
    code: 0,
    msg: "注册成功",
    data: {
      _openId: wxContext.OPENID,
      avatarUrl,
      nickName
    }
  };
}