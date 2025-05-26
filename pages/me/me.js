const app = getApp();

Page({
    // 页面的初始数据
    data: {
        userInfo: null,
        hasUserInfo: false,
    },

    // 授权登录
    async handleLogin(e) {
        wx.showLoading({
            title: "正在授权中 ...",
        });

        const response = await wx.cloud.callFunction({
            name: "login"
        });
        wx.hideLoading();

        if (response.result.code === 0) {
            let userInfomation = response.result.data;

            wx.setStorageSync("userInfo", userInfomation);

            this.setData({
                userInfo: userInfomation,
                hasUserInfo: true,
            });
            console.log(userInfomation)
        } else {
            wx.showToast({
                title: response.result.msg,
                icon: "none",
                duration: 2000,
            });
            wx.navigateTo({
              url: '/pages/register/register',
            })
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
        if (userInfo) {
            this.setData({
                userInfo,
            });
        }
    },

    onShow() {
        // 每次页面显示时检查本地缓存
        const userInfo = wx.getStorageSync("userInfo");
        if (userInfo) {
            this.setData({
                userInfo,
                hasUserInfo: true,
            });
        } else {
            this.setData({
                userInfo: null,
                hasUserInfo: false,
            });
        }
    },

    goToCheckIn: function(e) {
        wx.navigateTo({
          url: '/pages/checkIn/checkIn',
        })
    },
    goToHistory: function(e) {
        wx.navigateTo({
          url: '/pages/learn-history/learn-history',
        })
    },
    goToStatistics: function(e) {
        wx.navigateTo({
          url: '/pages/learn-statistics/learn-statistics',
        })
    }
});