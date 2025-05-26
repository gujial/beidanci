Component({
    properties: {
      checkedDates: {
        type: Array,
        value: []
      }
    },
    data: {
      days: []
    },
    lifetimes: {
      attached() {
        this.generateCalendar()
      }
    },
    methods: {
      generateCalendar() {
        const now = new Date()
        const year = now.getFullYear()
        const month = now.getMonth()
        const totalDays = new Date(year, month + 1, 0).getDate()
        const firstDay = new Date(year, month, 1).getDay() // 0 (Sun) ~ 6 (Sat)
  
        const days = []
        for (let i = 0; i < firstDay; i++) {
          days.push({ day: '', checked: false })
        }
  
        for (let d = 1; d <= totalDays; d++) {
          const dayStr = `${year}-${(month + 1).toString().padStart(2, '0')}-${d.toString().padStart(2, '0')}`
          const isChecked = this.properties.checkedDates.includes(dayStr)
          days.push({ day: d, checked: isChecked })
        }
  
        this.setData({ days })
      }
    },
    observers: {
      'checkedDates': function () {
        this.generateCalendar()
      }
    }
  })
  