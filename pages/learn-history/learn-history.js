const {
    formatTime
} = require('../../utils/formatDate')

Page({
    data: {
        records: [],
        searchKeyword: '',
        startDate: '', // yyyy-mm-dd
        endDate: '',
        levels: ['全部', 'cet4', 'cet6'],
        levelOptions: {}, // 存储词库选项的映射关系
        levelIndex: 0, // 默认选中"全部"
        limit: 20,
        skip: 0,
        hasMore: true
    },

    onLoad() {
        this.fetchUserWordbanks();
    },
    
    // 获取用户词库列表，更新筛选选项
    fetchUserWordbanks() {
        wx.cloud.callFunction({
            name: 'wordbank',
            data: {
                action: 'getWordbanks'
            },
            success: res => {
                if (res.result.success) {
                    // 构建所有词库选项
                    const userBanks = res.result.data || [];
                    const levels = ['全部', 'cet4', 'cet6'];
                    const levelOptions = {
                        '全部': '',
                        'cet4': 'cet4', 
                        'cet6': 'cet6'
                    };
                    
                    // 添加用户词库选项
                    userBanks.forEach(bank => {
                        levels.push(bank.name);
                        levelOptions[bank.name] = 'user_' + bank._id;
                    });
                    
                    this.setData({
                        levels,
                        levelOptions
                    }, () => {
                        this.getRecords();
                    });
                } else {
                    // 即使获取词库失败，也加载记录
                    this.getRecords();
                }
            },
            fail: err => {
                console.error('获取词库列表失败', err);
                // 即使获取词库失败，也加载记录
                this.getRecords();
            }
        });
    },

    onSearchInput(e) {
        this.setData({
            searchKeyword: e.detail.value
        })
    },

    // 获取记录
    getRecords() {
        wx.cloud.callFunction({
            name: 'getLearnHistory',
            data: {
                limit: 100
            },
            success: res => {
                if (res.result.success) {
                    const processed = res.result.data.map(item => ({
                        ...item,
                        timeStr: formatTime(item.timestamp)
                    }))
                    this.setData({
                        records: processed
                    })
                } else {
                    wx.showToast({
                        title: '加载失败',
                        icon: 'none'
                    })
                }
            }
        })
    },

    // 搜索功能
    searchRecords: function () {
        const {
            searchKeyword,
            startDate,
            endDate,
            levels,
            levelIndex,
            levelOptions,
            limit
        } = this.data

        let startTime = startDate ? new Date(startDate).getTime() : null
        let endTime = endDate ? new Date(endDate).getTime() + 86400000 - 1 : null
        const selectedLevel = levels[levelIndex]
        const selectedLevelValue = levelOptions[selectedLevel]

        wx.cloud.callFunction({
            name: 'getLearnHistory',
            data: {
                keyword: searchKeyword,
                startTime,
                endTime,
                level: selectedLevelValue || undefined,
                limit,
                skip: 0
            },
            success: res => {
                if (res.result.success) {
                    const processed = res.result.data.map(item => ({
                        ...item,
                        timeStr: formatTime(item.timestamp)
                    }))
                    this.setData({
                        records: processed,
                        skip: limit,
                        hasMore: processed.length === limit
                    })
                } else {
                    wx.showToast({
                        title: '获取失败',
                        icon: 'none'
                    })
                }
            }
        })
    },

    clearSearch: function () {
        this.setData({
            searchKeyword: '',
            records: []
        })
        this.getRecords()
    },

    onStartDateChange: function (e) {
        this.setData({
            startDate: e.detail.value
        })
    },

    onEndDateChange: function (e) {
        this.setData({
            endDate: e.detail.value
        })
    },

    onLevelChange: function (e) {
        this.setData({
            levelIndex: e.detail.value,
            records: [],
            skip: 0
        }, () => {
            this.searchRecords()
        })
    },

    loadMore() {
        const {
            searchKeyword,
            startDate,
            endDate,
            levels,
            levelIndex,
            levelOptions,
            limit,
            skip
        } = this.data
        let startTime = startDate ? new Date(startDate).getTime() : null
        let endTime = endDate ? new Date(endDate).getTime() + 86400000 - 1 : null
        const selectedLevel = levels[levelIndex]
        const selectedLevelValue = levelOptions[selectedLevel]

        wx.cloud.callFunction({
            name: 'getLearnHistory',
            data: {
                keyword: searchKeyword,
                startTime,
                endTime,
                level: selectedLevelValue || undefined,
                limit,
                skip
            },
            success: res => {
                if (res.result.success) {
                    const newRecords = res.result.data.map(item => ({
                        ...item,
                        timeStr: formatTime(item.timestamp)
                    }))
                    this.setData({
                        records: this.data.records.concat(newRecords),
                        skip: this.data.skip + limit,
                        hasMore: newRecords.length === limit
                    })
                }
            }
        })
    },

    onReachBottom() {
        if (this.data.hasMore) {
            this.loadMore()
        }
    }
})