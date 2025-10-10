// index.js
Page({
  data: {
    currentMonth: '',
    monthlyBudget: 0,
    monthlyExpense: 0,
    remainingBudget: 0,
    budgetProgress: 0,
    recentRecords: [],
    formattedBudget: '0.00',
    formattedExpense: '0.00',
    formattedRemaining: '0.00'
  },

  onLoad() {
    this.getCurrentMonth();
    this.loadBudgetData();
    this.loadRecentRecords();
    // 初始化格式化金额
    this.updateFormattedAmounts();
  },

  onShow() {
    // 页面显示时重新加载所有数据，确保数据同步
    this.getCurrentMonth();
    this.loadBudgetData();
    this.loadRecentRecords();
    // 确保格式化金额更新
    this.updateFormattedAmounts();
  },

  // 获取当前月份
  getCurrentMonth() {
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();
    this.setData({
      currentMonth: `${year}年${month}月`
    });
  },

  // 加载预算数据
  loadBudgetData() {
    const db = wx.cloud.database();
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;

    // 先设置默认值，确保页面有数据显示
    this.setData({
      monthlyBudget: 0,
      monthlyExpense: 0,
      remainingBudget: 0,
      budgetProgress: 0
    }, () => {
      this.updateFormattedAmounts();
    });

    // 获取月度预算（使用当前用户的openid）
    db.collection('budgets').where({
      year: year,
      month: month,
      _openid: db.command.exists(true) // 使用当前用户的openid
    }).get().then(res => {
      if (res.data && res.data.length > 0) {
        const budget = res.data[0];
        this.setData({
          monthlyBudget: budget.amount || 0
        }, () => {
          this.updateFormattedAmounts();
          this.calculateExpense(year, month);
        });
      } else {
        // 如果没有预算数据，直接计算支出
        this.calculateExpense(year, month);
      }
    }).catch(err => {
      console.error('获取预算数据失败:', err);
      // 数据库集合不存在时，直接计算支出
      if (err.errCode === -502005) {
        console.log('budgets集合尚未创建，直接计算支出');
        this.calculateExpense(year, month);
      } else {
        this.calculateExpense(year, month);
      }
    });
  },

  // 格式化金额
  formatAmount(amount) {
    const num = parseFloat(amount) || 0;
    return num.toFixed(2);
  },

  // 更新格式化金额
  updateFormattedAmounts() {
    const budget = this.formatAmount(this.data.monthlyBudget);
    const expense = this.formatAmount(this.data.monthlyExpense);
    const remaining = this.formatAmount(this.data.remainingBudget);
    
    this.setData({
      formattedBudget: budget,
      formattedExpense: expense,
      formattedRemaining: remaining
    });
  },

  // 计算月度支出
  calculateExpense(year, month) {
    const db = wx.cloud.database();
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    // 先设置默认值，确保页面有数据显示
    this.setData({
      monthlyExpense: 0,
      remainingBudget: this.data.monthlyBudget || 0,
      budgetProgress: 0
    });

    db.collection('records').where({
      type: 'expense',
      date: db.command.gte(startDate).and(db.command.lte(endDate)),
      _openid: db.command.exists(true) // 使用当前用户的openid
    }).get().then(res => {
      // 确保数据存在，避免NaN
      const totalExpense = res.data && res.data.length > 0 ? 
        res.data.reduce((sum, record) => sum + (parseFloat(record.amount) || 0), 0) : 0;
      
      const monthlyBudget = parseFloat(this.data.monthlyBudget) || 0;
      const remaining = monthlyBudget - totalExpense;
      const progress = monthlyBudget > 0 ? 
        Math.min(100, (totalExpense / monthlyBudget) * 100) : 0;

      this.setData({
        monthlyExpense: totalExpense,
        remainingBudget: Math.max(0, remaining),
        budgetProgress: Math.round(progress)
      }, () => {
        // 数据更新后格式化金额
        this.updateFormattedAmounts();
      });
    }).catch(err => {
      console.error('计算支出失败:', err);
      // 数据库集合不存在时的处理
      if (err.errCode === -502005) {
        console.log('records集合尚未创建，使用默认值');
        this.setData({
          monthlyExpense: 0,
          remainingBudget: this.data.monthlyBudget || 0,
          budgetProgress: 0
        }, () => {
          this.updateFormattedAmounts();
        });
      } else {
        // 其他错误也使用默认值
        this.setData({
          monthlyExpense: 0,
          remainingBudget: this.data.monthlyBudget || 0,
          budgetProgress: 0
        }, () => {
          this.updateFormattedAmounts();
        });
      }
    });
  },

  // 加载最近记录
  loadRecentRecords() {
    const db = wx.cloud.database();
    db.collection('records').orderBy('date', 'desc').limit(5).get().then(res => {
      const records = res.data.map(record => ({
        id: record._id,
        category: record.category,
        amount: record.amount,
        type: record.type,
        note: record.note,
        time: this.formatTime(record.date)
      }));
      this.setData({
        recentRecords: records
      });
    }).catch(err => {
      console.error('获取最近记录失败:', err);
      // 数据库集合不存在时的处理
      if (err.errCode === -502005) {
        console.log('records集合尚未创建');
        this.setData({
          recentRecords: []
        });
      }
    });
  },

  // 格式化时间
  formatTime(date) {
    const now = new Date();
    const recordDate = new Date(date);
    const diff = now - recordDate;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 60) {
      return `${minutes}分钟前`;
    } else if (hours < 24) {
      return `${hours}小时前`;
    } else if (days < 7) {
      return `${days}天前`;
    } else {
      return `${recordDate.getMonth() + 1}月${recordDate.getDate()}日`;
    }
  },

  // 快速记账
  quickRecord() {
    wx.navigateTo({
      url: '/pages/accounting/record'
    });
  },

  // 导航到记账页面
  navigateToAccounting() {
    wx.switchTab({
      url: '/pages/accounting/record'
    });
  },

  // 导航到统计页面
  navigateToStatistics() {
    wx.navigateTo({
      url: '/pages/accounting/statistics'
    });
  },

  // 导航到预算页面
  navigateToBudget() {
    wx.navigateTo({
      url: '/pages/accounting/budget'
    });
  },

  // 导航到转盘游戏
  navigateToWheel() {
    wx.switchTab({
      url: '/pages/games/wheel'
    });
  },

  // 导航到问答游戏
  navigateToQA() {
    wx.navigateTo({
      url: '/pages/games/qa'
    });
  },

  // 导航到骰子游戏
  navigateToDice() {
    wx.navigateTo({
      url: '/pages/games/dice'
    });
  },

  // 页面分享功能
  onShareAppMessage() {
    return {
      title: '记账游戏助手 - 轻松记账，快乐游戏',
      path: '/pages/index/index',
      imageUrl: '/images/icons/share.png'
    };
  },

  // 分享到朋友圈
  onShareTimeline() {
    return {
      title: '记账游戏助手 - 你的智能记账伙伴',
      imageUrl: '/images/icons/share.png'
    };
  }
});
