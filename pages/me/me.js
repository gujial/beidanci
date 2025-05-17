const app = getApp();

Page({
    // 页面的初始数据
    data: {
        userInfo: null,
        hasUserInfo: false,
    },

    // 授权登录
    async handleLogin(e) {
        // 1、获取用户信息
        const {
            userInfo
        } = await wx
            .getUserProfile({
                desc: "用于获取头像和昵称信息",
            })
            .catch((err) => {
                console.log(err);
            });

        if (userInfo) {
            // 授权成功后
            // 将用户信息存储在 本地存储中，用于用户下次进入小程序时，不必重复授权登录
            wx.setStorageSync("userInfo", userInfo);

            // 实现用户注册（如果用户已注册，直接登录即可）
            // 设置加载中的提示
            wx.showLoading({
                title: "正在授权中 ...",
            });

            // 调用云函数 -------------------
            // 2、把当前用户信息提交给后端，用于创建生成一个用户账号（即：注册用户信息
            wx.cloud.callFunction({
                name: "login",
                data: {
                    avatarUrl: userInfo.avatarUrl,
                    nickName: userInfo.nickName,
                },
            });

            wx.hideLoading();
            // 更新 data
            this.setData({
                userInfo,
                hasUserInfo: true,
            });
        }
    },

    // 退出登录
    outLogin() {
        // 清除本地缓存
        wx.clearStorageSync("userInfo");
        // 更新 data
        this.setData({
            // 清空页面数据
            userInfo: "",
        });
    },

    async onLoad() {
        // 获取本地缓存中的用户登录信息
        const userInfo = await wx.getStorageSync("userInfo");
        // 更新data
        console.log(userInfo)
        if (userInfo) {
            this.setData({
                userInfo,
            });
        }
    },
});