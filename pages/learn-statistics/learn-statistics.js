import * as echarts from '../../components/ec-canvas/echarts';

Page({
    data: {
        stats: {
            streak: 0,
            totalScore: 0,
            totalTests: 0,
            dailyCounts: [],
            byLevel: {}
        },
        ecLine: {
            lazyLoad: true,
        },
        ecPie: {
            lazyLoad: true,
        }
    },

    onLoad() {
        this.fetchStats()
    },

    fetchStats() {
        wx.cloud.callFunction({
            name: 'getLearnStats',
            success: res => {
                console.log('[云函数返回]', res.result)
                if (res.result.success) {
                    this.setData({
                        stats: {
                            ...this.data.stats,
                            ...res.result.data
                        }
                    }, () => {
                        this.initLineChart()
                        this.initPieChart()
                    })
                } else {
                    wx.showToast({ title: '获取失败', icon: 'none' })
                }
            },
            fail: err => {
                wx.showToast({ title: '请求失败', icon: 'none' })
            }
        })
    },

    initLineChart() {
        const component = this.selectComponent('#lineChart');

        component.init((canvas, width, height, dpr) => {
            const chart = echarts.init(canvas, null, { width, height, devicePixelRatio: dpr });
            canvas.setChart(chart);

            // 处理日期数据
            const dates = [];
            const counts = [];
            const dailyMap = {};

            (this.data.stats.dailyCounts || []).forEach(item => {
                dailyMap[item._id] = item.count;
            });

            // 生成近7天日期
            const today = new Date();
            for (let i = 6; i >= 0; i--) {
                const d = new Date(today);
                d.setDate(d.getDate() - i);
                const str = d.toISOString().slice(0, 10);
                dates.push(str);
                counts.push(dailyMap[str] || 0);
            }

            chart.setOption({
                title: { text: '每日学习数量', left: 'center' },
                xAxis: { type: 'category', data: dates },
                yAxis: { type: 'value' },
                series: [{
                    data: counts,
                    type: 'line',
                    smooth: true,
                    areaStyle: {}
                }]
            });

            return chart;
        });
    },

    initPieChart() {
        const component = this.selectComponent('#pieChart');

        component.init((canvas, width, height, dpr) => {
            const chart = echarts.init(canvas, null, { width, height, devicePixelRatio: dpr });
            canvas.setChart(chart);

            const levelMap = { cet4: 'CET-4', cet6: 'CET-6' };
            const byLevel = this.data.stats.byLevel || {};

            const pieData = Object.entries(byLevel).map(([level, count]) => ({
                name: levelMap[level] || level,
                value: count
            }));

            chart.setOption({
                title: { text: '词库分布', left: 'center' },
                tooltip: { trigger: 'item' },
                legend: { bottom: 10, left: 'center' },
                series: [{
                    name: '词库',
                    type: 'pie',
                    radius: '50%',
                    data: pieData,
                    emphasis: {
                        itemStyle: {
                            shadowBlur: 10,
                            shadowOffsetX: 0,
                            shadowColor: 'rgba(0, 0, 0, 0.5)'
                        }
                    }
                }]
            });

            return chart;
        });
    }
})