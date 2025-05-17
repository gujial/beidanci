// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
    env: cloud.DYNAMIC_CURRENT_ENV
}) // 使用当前云环境

// 云函数入口函数
exports.main = async (event) => {
    const wxContext = cloud.getWXContext();
    // 解构前端传入的字段
    const { avatarUrl, nickName } = event;
  
    // 如果数据库中没有当前用户的信息（注册）
  
    // 1、初始化数据库（获取数据库的引用）
    const db = cloud.database();
    // 2、指定集合（数据表），获取集合的引用
    const users = db.collection("users");
  
    // 在新增用户数据之前
    // 3、先查询当前用户是否已注册过
    const { data } = await users
      .where({
        _openId: wxContext.OPENID,
      })
      .get();
  
    // 根据返回的 data 数组的长度来进行判断，是否已存在该用户
    if (data.length === 0) {
      // 等于 0 ，数据库中没有当前用户的信息（注册）
  
      // 在数据库中新增用户数据（注册）
      const res = await users.add({
        data: {
          avatarUrl,
          nickName,
          // 账户余额
          score: 0,
          // 注册时一定要加入 openid 作为唯一标识
          _openId: wxContext.OPENID,
        },
      });
  
      // ---------------------
      // 当用户注册成功后，根据 ID 快速查询当前用户的信息，并返回给前端
      // doc：接收 _id 快速返回该 id 的数据
      const user = await users.doc(res._id).get();
  
      // 注册成功后，返回当前用户数据
      return {
        data: user.data,
      };
    } else {
      // 如果数据库中存在当前用户的信息（已注册过），则直接返回当前用户信息（登录）
      // 登录成功后，返回当前用户数据
      return {
        data: data[0],
      };
    }
  };