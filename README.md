# 背单词小程序

## 项目简介
本项目是一个基于微信小程序平台构建的英语单词记忆辅助工具，支持 CET-4 / CET-6 等词库切换，具备答题、打卡、学习统计、排行榜、词库设置等功能，帮助用户高效记忆和复习单词。

## 技术栈
| 技术            | 描述                                   |
| ------------- | ------------------------------------ |
| 微信小程序原生开发     | 页面与交互逻辑                              |
| 云开发 CloudBase | 云函数、数据库、云存储                          |
| ECharts       | 图表展示学习数据                             |
| 小程序自带组件库      | `wx:for` / `picker` / `button` 等原生组件 |

## 项目目录结构
```
.  
├── 背单词小程序产品文档.md  
├── app.js  
├── app.json  
├── app.wxss  
├── cloud  
│   ├── checkIn  
│   │   ├── config.json  
│   │   ├── index.js  
│   │   └── package.json  
│   ├── getCheckInHistory  
│   │   ├── config.json  
│   │   ├── index.js  
│   │   └── package.json  
│   ├── getLeaderboard  
│   │   ├── config.json  
│   │   ├── index.js  
│   │   └── package.json  
│   ├── getLearnHistory  
│   │   ├── config.json  
│   │   ├── index.js  
│   │   └── package.json  
│   ├── getLearnStats  
│   │   ├── config.json  
│   │   ├── index.js  
│   │   └── package.json  
│   ├── getMonthlyCheckIn  
│   │   ├── config.json  
│   │   ├── index.js  
│   │   └── package.json  
│   ├── getWords  
│   │   ├── config.json  
│   │   ├── index.js  
│   │   └── package.json  
│   ├── login  
│   │   ├── config.json  
│   │   ├── index.js  
│   │   └── package.json  
│   ├── register  
│   │   ├── config.json  
│   │   ├── index.js  
│   │   └── package.json  
│   └── score  
│       ├── config.json  
│       ├── index.js  
│       └── package.json  
├── components  
│   ├── calendar  
│   │   ├── calendar.js  
│   │   ├── calendar.json  
│   │   ├── calendar.wxml  
│   │   └── calendar.wxss  
│   └── ec-canvas  
│       ├── ec-canvas.js  
│       ├── ec-canvas.json  
│       ├── ec-canvas.wxml  
│       ├── ec-canvas.wxss  
│       ├── echarts.js  
│       └── wx-canvas.js  
├── ide.wxproj  
├── images  
│   ├── bingmayong.png  
│   ├── category.png  
│   ├── category_selected.png  
│   ├── default-avatar.png  
│   ├── empty-bookings.png  
│   ├── empty-favorites.png  
│   ├── empty.png  
│   ├── gugong.png  
│   ├── home.png  
│   ├── home_selected.png  
│   ├── jiuzhaigou.png  
│   ├── profile.png  
│   ├── profile_selected.png  
│   ├── sanya.png  
│   ├── xihu.png  
│   └── zhangjiajie.png  
├── pages  
│   ├── about  
│   │   ├── about.js  
│   │   ├── about.json  
│   │   ├── about.wxml  
│   │   └── about.wxss  
│   ├── checkIn  
│   │   ├── checkIn.js  
│   │   ├── checkIn.json  
│   │   ├── checkIn.wxml  
│   │   └── checkIn.wxss  
│   ├── index  
│   │   ├── index.js  
│   │   ├── index.json  
│   │   ├── index.wxml  
│   │   └── index.wxss  
│   ├── learn  
│   │   ├── learn.js  
│   │   ├── learn.json  
│   │   ├── learn.wxml  
│   │   └── learn.wxss  
│   ├── learn-history  
│   │   ├── learn-history.js  
│   │   ├── learn-history.json  
│   │   ├── learn-history.wxml  
│   │   └── learn-history.wxss  
│   ├── learn-statistics  
│   │   ├── learn-statistics.js  
│   │   ├── learn-statistics.json  
│   │   ├── learn-statistics.wxml  
│   │   └── learn-statistics.wxss  
│   ├── me  
│   │   ├── me.js  
│   │   ├── me.json  
│   │   ├── me.wxml  
│   │   └── me.wxss  
│   ├── ranking  
│   │   ├── ranking.js  
│   │   ├── ranking.json  
│   │   ├── ranking.wxml  
│   │   └── ranking.wxss  
│   ├── register  
│   │   ├── register.js  
│   │   ├── register.json  
│   │   ├── register.wxml  
│   │   └── register.wxss  
│   └── settings  
│       ├── settings.js  
│       ├── settings.json  
│       ├── settings.wxml  
│       └── settings.wxss  
├── project.config.json  
├── project.private.config.json  
├── README.md  
├── sitemap.json  
└── utils  
   └── formatDate.js  
  
28 directories, 106 files

```
> `images`中没有用到的照片素材以后会删

## 数据库设计
> 数据库使用键值对型（文档）数据库而非关系型（模型）数据库

### beidanci_cet4
| 字段        | 类型     | 说明  |
| --------- | ------ | --- |
| _id       | String | 标识符 |
| translate | String | 翻译  |
| word      | String | 单词  |
### beidanci_cet6
| 字段        | 类型     | 说明  |
| --------- | ------ | --- |
| _id       | String | 标识符 |
| translate | String | 翻译  |
| word      | String | 单词  |

### checkIn
| 字段        | 类型     | 说明     |
| --------- | ------ | ------ |
| _id       | String | 标识符    |
| _openid   | String | 用户标识   |
| date      | String | 打卡日期   |
| streak    | Number | 连续打卡天数 |
| timestamp | Date   | 打卡时间   |

### learnHistory
| 字段        | 类型     | 说明   |
| --------- | ------ | ---- |
| _id       | String | 标识符  |
| _openid   | String | 用户标识 |
| word      | String | 单词   |
| translate | String | 翻译   |
| level     | String | 所属词库 |
| timestamp | Date   | 学习时间 |

### score
| 字段        | 类型     | 说明   |
| --------- | ------ | ---- |
| _id       | String | 标识符  |
| _openid   | String | 用户标识 |
| score     | Number | 得分   |
| timestamp | Date   | 时间   |

### users
| 字段         | 类型     | 说明   |
| ---------- | ------ | ---- |
| _id        | String | 标识符  |
| _openid    | String | 用户标识 |
| avatarUrl  | String | 头像链接 |
| createTime | Date   | 注册时间 |
| nickName   | String | 用户昵称 |

## 云函数说明
| 云函数名                | 说明                                      |
| ------------------- | --------------------------------------- |
| `getWords`          | 根据词库随机获取一个单词及四个选项（含一个正确释义），并将单词记录到学习记录中 |
| `score`             | 记录当前答题得分到 `score` 表                     |
| `checkIn`           | 检查并记录打卡数据                               |
| `getLearnStats`     | 返回连续打卡天数、总分、每天学习数量、词库分布                 |
| `getCheckInHistory` | 获取打卡历史记录                                |
| `getMonthlyCheckIn` | 获取本月打卡记录                                |
| `login`             | 登录                                      |
| `register`          | 注册                                      |
| `getLearnHistory`   | 获取学习记录                                  |
| `getLeaderBoard`    | 获取排行榜数据                                 |

## 页面功能说明
| 页面                    | 功能                   |
| --------------------- | -------------------- |
| 学习页（learn）            | 选择答案、切换词库、打卡、自动加载下一题 |
| 学习统计页（learn-stastics） | 折线图显示每日学习量、饼图显示词库分布  |
| 排行榜页（ranking）         | 展示前 3 名与其他用户得分（聚合计算） |
| 设置页（settings）         | 切换默认词库、本地存储偏好设置      |
| 关于页（about）            | 展示作者信息、小程序介绍、联系方式等   |
| 打卡页（checkIn）          | 展示用户打卡记录信息           |
| 首页（index）             | 欢迎页面                 |
| 注册页（register）         | 注册页面                 |
| 学习记录页（learn-history）  | 展示用户学习记录，并提供筛选功能方便复习 |
| 我的页（me）               | 用户登录入口，并提供仅登录后可用的功能  |

## 小程序设置说明
- 本地存储词库偏好：`wx.setStorageSync('selectedLevel', 'cet4')`
- 离开页面时保存成绩并上传：`onUnload()` 调用 `score` 云函数
- 数据持久化采用小程序云开发数据库，无需额外服务器

## 部署与运行
- 安装微信开发者工具并登录
- 导入项目（确保启用云开发环境）
- 初始化数据库集合：
    - `words`、`learnHistory`、`checkIn`、`score`
- 上传并部署云函数：
    - 在云开发控制台中上传上述函数代码并部署
- 使用测试账号运行项目，确保所有功能连通

## 致谢
给繁荣哥磕个大的，求求你放过我们吧✋😭🤚