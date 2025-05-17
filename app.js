// app.js
App({
    onLaunch() {
        wx.cloud.init({
            // API 调用的默认环境配置
            env: "cloud1-8g6lqpio30d4e490",
            // 将用户访问记录到用户管理中，在控制台中可见
            traceUser: true,
        });
    }
})