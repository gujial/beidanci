const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const { avatarUrl, nickName } = event;
  const db = cloud.database();
  const users = db.collection("users");

  const { data } = await users.where({
    _openid: wxContext.OPENID,
  }).get();

  if (data.length > 0) {
    return {
      code: 2,
      msg: "账号已存在，请直接登录",
      data: data[0]
    };
  }

  await users.add({
    data: {
      _openid: wxContext.OPENID,
      avatarUrl, // 这是 fileID
      nickName,
      createTime: new Date()
    }
  });

  return {
    code: 0,
    msg: "注册成功",
    data: {
      _openid: wxContext.OPENID,
      avatarUrl,
      nickName
    }
  };
}
