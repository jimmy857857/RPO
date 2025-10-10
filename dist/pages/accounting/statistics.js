// pages/accounting/statistics.js
Page({
  data: {
    timeRange: 'month',
    currentDate: '',
    customDate: '',
    trendType: 'daily',
    showDetail: false,
    incomeChange: 0,
    expenseChange: 0,
    budgetRemaining: 0,
    isOverBudget: false,
    budgetProgress: 0,
    budgetUsed: 0,
    budgetTotal: 0,
    categoryBudgets: [],
    formattedTotalIncome: '0.00',
    formattedTotalExpense: '0.00',
    formattedBalance: '0.00',
    balanceClass: 'positive',
    budgetStatusClass: 'normal',
    budgetStatusText: '预算正常',
    formattedBudgetUsed: '0.00',
    formattedBudgetTotal: '0.00',
    statistics: {
      totalIncome: 0,
      totalExpense: 0,
      balance: 0,
      categoryExpense: [],
      dailyExpense: []
    },
    chartData: {
      pieChart: [],
      barChart: []
    }
  },

  onLoad() {
    this.setCurrentDate();
    // 延迟加载数据，确保Canvas已渲染完成
    setTimeout(() => {
      this.loadStatistics();
    }, 500);
  },

  onShow() {
    // 页面显示时重新加载数据，确保数据同步
    setTimeout(() => {
      this.loadStatistics();
    }, 300);
  },

  // 设置当前日期
  setCurrentDate() {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    this.setData({
      currentDate: `${year}年${month}月`
    });
  },

  // 时间范围切换
  onTimeRangeChange(e) {
    const range = e.currentTarget.dataset.range;
    this.setData({
      timeRange: range
    });
    this.loadStatistics();
  },

  // 加载统计数据
  loadStatistics() {
    wx.showLoading({
      title: '加载中...'
    });

    const db = wx.cloud.database();
    const now = new Date();
    let startDate, endDate;

    // 根据时间范围设置查询条件
    switch (this.data.timeRange) {
      case 'day':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
        break;
      case 'week':
        const day = now.getDay();
        const diff = now.getDate() - day + (day === 0 ? -6 : 1);
        startDate = new Date(now.getFullYear(), now.getMonth(), diff);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 6);
        endDate.setHours(23, 59, 59, 999);
        break;
      case 'month':
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59);
        break;
    }

    // 获取收入和支出数据（使用当前用户的openid）
    Promise.all([
      db.collection('records').where({
        type: 'income',
        date: db.command.gte(startDate).and(db.command.lte(endDate)),
        _openid: db.command.exists(true)
      }).get(),
      db.collection('records').where({
        type: 'expense',
        date: db.command.gte(startDate).and(db.command.lte(endDate)),
        _openid: db.command.exists(true)
      }).get()
    ]).then(([incomeRes, expenseRes]) => {
      // 确保数据存在，避免NaN
      const totalIncome = incomeRes.data && incomeRes.data.length > 0 ? 
        incomeRes.data.reduce((sum, record) => sum + (record.amount || 0), 0) : 0;
      const totalExpense = expenseRes.data && expenseRes.data.length > 0 ? 
        expenseRes.data.reduce((sum, record) => sum + (record.amount || 0), 0) : 0;
      const balance = totalIncome - totalExpense;

      // 分类统计支出
      const categoryMap = {};
      if (expenseRes.data && expenseRes.data.length > 0) {
        expenseRes.data.forEach(record => {
          if (!categoryMap[record.category]) {
            categoryMap[record.category] = 0;
          }
          categoryMap[record.category] += (record.amount || 0);
        });
      }

      const categoryExpense = Object.keys(categoryMap).map(category => ({
        category: category,
        amount: categoryMap[category],
        percentage: totalExpense > 0 ? (categoryMap[category] / totalExpense * 100).toFixed(1) : '0.0'
      })).sort((a, b) => b.amount - a.amount);

      // 每日支出统计
      const dailyMap = {};
      if (expenseRes.data && expenseRes.data.length > 0) {
        expenseRes.data.forEach(record => {
          if (record.date) {
            const dateStr = record.date.toISOString ? record.date.toISOString().split('T')[0] : 
                           new Date(record.date).toISOString().split('T')[0];
            if (!dailyMap[dateStr]) {
              dailyMap[dateStr] = 0;
            }
            dailyMap[dateStr] += (record.amount || 0);
          }
        });
      }

      const dailyExpense = Object.keys(dailyMap).map(date => ({
        date: date,
        amount: dailyMap[date]
      })).sort((a, b) => a.date.localeCompare(b.date));

      this.setData({
        statistics: {
          totalIncome: totalIncome,
          totalExpense: totalExpense,
          balance: balance,
          categoryExpense: categoryExpense,
          dailyExpense: dailyExpense
        }
      }, () => {
        // 更新格式化金额和样式类
        this.updateFormattedData();
        // 确保数据更新后重新绘制图表
        this.generateCharts();
        wx.hideLoading();
      });
    }).catch(err => {
      wx.hideLoading();
      if (err.errCode === -502005) {
        wx.showModal({
          title: '数据库未初始化',
          content: '请先在云开发控制台创建records集合',
          showCancel: false
        });
      } else {
        wx.showToast({
          title: '加载失败',
          icon: 'none'
        });
      }
      console.error('加载统计数据失败:', err);
    });
  },

  // 生成图表数据
  generateCharts() {
    const { categoryExpense, dailyExpense, totalExpense } = this.data.statistics;

    // 饼图数据（分类支出）- 确保百分比计算准确
    const pieData = categoryExpense.map((item, index) => {
      const amount = Number(item.amount) || 0;
      const percentage = totalExpense > 0 ? (amount / totalExpense * 100).toFixed(1) : '0.0';
      
      return {
        name: item.category,
        value: amount,
        percentage: percentage,
        color: this.getCategoryColor(index)
      };
    });

    // 柱状图数据（每日支出）
    const barData = dailyExpense.map(item => ({
      date: item.date.split('-').slice(1).join('/'),
      amount: Number(item.amount) || 0
    }));

    this.setData({
      'chartData.pieChart': pieData,
      'chartData.barChart': barData
    }, () => {
      // 延迟绘制图表，确保数据更新完成
      setTimeout(() => {
        this.drawPieChart();
        this.drawBarChart();
      }, 100);
    });
  },

  // 获取分类颜色
  getCategoryColor(index) {
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4',
      '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F',
      '#FFA07A', '#20B2AA', '#87CEFA', '#98FB98',
      '#FF9999', '#66CCCC', '#FFCC66', '#99CC99',
      '#CC99FF', '#FF9966', '#66CC99', '#FF99CC'
    ];
    return colors[index % colors.length];
  },

  // 更新格式化数据
  updateFormattedData() {
    const { totalIncome, totalExpense, balance, categoryExpense } = this.data.statistics;
    
    // 格式化金额，保留两位小数
    const formattedTotalIncome = (totalIncome || 0).toFixed(2);
    const formattedTotalExpense = (totalExpense || 0).toFixed(2);
    const formattedBalance = (balance || 0).toFixed(2);
    
    // 设置结余样式类
    const balanceClass = (balance || 0) >= 0 ? 'positive' : 'negative';
    
    // 格式化分类支出数据
    const formattedCategoryExpense = (categoryExpense || []).map(item => ({
      ...item,
      amount: (Number(item.amount) || 0).toFixed(2),
      percentage: (Number(item.percentage) || 0).toFixed(1)
    }));
    
    // 格式化预算数据
    const budgetStatusClass = this.data.isOverBudget ? 'over' : 'normal';
    const budgetStatusText = this.data.isOverBudget ? '已超预算' : '预算正常';
    const formattedBudgetUsed = (this.data.budgetUsed || 0).toFixed(2);
    const formattedBudgetTotal = (this.data.budgetTotal || 0).toFixed(2);
    
    // 格式化分类预算数据
    const formattedCategoryBudgets = (this.data.categoryBudgets || []).map(item => ({
      ...item,
      used: (Number(item.used) || 0).toFixed(2),
      total: (Number(item.total) || 0).toFixed(2)
    }));
    
    this.setData({
      formattedTotalIncome: formattedTotalIncome,
      formattedTotalExpense: formattedTotalExpense,
      formattedBalance: formattedBalance,
      balanceClass: balanceClass,
      budgetStatusClass: budgetStatusClass,
      budgetStatusText: budgetStatusText,
      formattedBudgetUsed: formattedBudgetUsed,
      formattedBudgetTotal: formattedBudgetTotal,
      'statistics.categoryExpense': formattedCategoryExpense,
      categoryBudgets: formattedCategoryBudgets
    });
  },

  // 绘制饼图
  drawPieChart() {
    const that = this;
    
    // 获取Canvas 2D上下文
    wx.createSelectorQuery().select('#pieChart').fields({ node: true, size: true }).exec((res) => {
      if (!res[0] || !res[0].node) {
        console.error('无法获取Canvas节点');
        return;
      }
      
      const canvas = res[0].node;
      const ctx = canvas.getContext('2d');
      const dpr = wx.getSystemInfoSync().pixelRatio;
      const width = res[0].width;
      const height = res[0].height;
      
      // 设置Canvas尺寸
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);
      
      // 清空画布
      ctx.clearRect(0, 0, width, height);
      
      const centerX = width / 2;
      const centerY = height / 2;
      const radius = Math.min(width, height) * 0.3; // 减小半径，留出更多边距

      const { pieChart } = that.data.chartData;

      // 检查数据有效性
      if (!pieChart || pieChart.length === 0 || pieChart.every(item => !item.value || item.value === 0)) {
        // 绘制空状态
        ctx.fillStyle = '#F8F9FA';
        ctx.fillRect(0, 0, width, height);
        
        ctx.font = '14px sans-serif';
        ctx.fillStyle = '#666';
        ctx.textAlign = 'center';
        ctx.fillText('暂无支出数据', centerX, centerY);
        return;
      }

      // 过滤掉值为0的数据
      const validData = pieChart.filter(item => item.value && item.value > 0);
      if (validData.length === 0) {
        ctx.fillStyle = '#F8F9FA';
        ctx.fillRect(0, 0, width, height);
        
        ctx.font = '14px sans-serif';
        ctx.fillStyle = '#666';
        ctx.textAlign = 'center';
        ctx.fillText('暂无支出数据', centerX, centerY);
        return;
      }

      const total = validData.reduce((sum, item) => sum + (Number(item.value) || 0), 0);
      let startAngle = -Math.PI / 2;

      // 绘制饼图
      validData.forEach(item => {
        const angle = ((Number(item.value) || 0) / total) * 2 * Math.PI;
        
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius, startAngle, startAngle + angle);
        ctx.closePath();
        
        ctx.fillStyle = item.color || '#28A745';
        ctx.fill();
        
        // 添加边框
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        startAngle += angle;
      });

      // 绘制中心空白圆
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius * 0.5, 0, 2 * Math.PI);
      ctx.fillStyle = '#FFFFFF';
      ctx.fill();

      // 绘制总计金额
      ctx.font = 'bold 14px sans-serif';
      ctx.fillStyle = '#333';
      ctx.textAlign = 'center';
      ctx.fillText('总支出', centerX, centerY - 12);
      ctx.font = 'bold 16px sans-serif';
      ctx.fillStyle = '#E74C3C';
      ctx.fillText(`¥${total.toFixed(0)}`, centerX, centerY + 12);
    });
  },

  // 绘制柱状图
  drawBarChart() {
    const that = this;
    
    // 获取Canvas 2D上下文
    wx.createSelectorQuery().select('#barChart').fields({ node: true, size: true }).exec((res) => {
      if (!res[0] || !res[0].node) {
        console.error('无法获取Canvas节点');
        return;
      }
      
      const canvas = res[0].node;
      const ctx = canvas.getContext('2d');
      const dpr = wx.getSystemInfoSync().pixelRatio;
      const width = res[0].width;
      const height = res[0].height;
      
      // 设置Canvas尺寸
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);
      
      const padding = 40;
      const chartWidth = width - padding * 2;
      const chartHeight = height - padding * 2;

      const { barChart } = that.data.chartData;

      if (!barChart || barChart.length === 0) {
        // 绘制空状态
        ctx.fillStyle = '#F8F9FA';
        ctx.fillRect(0, 0, width, height);
        
        ctx.font = '14px sans-serif';
        ctx.fillStyle = '#666';
        ctx.textAlign = 'center';
        ctx.fillText('暂无数据', width / 2, height / 2);
        return;
      }

      const maxAmount = Math.max(...barChart.map(item => item.amount));
      const barWidth = chartWidth / barChart.length * 0.6;
      const scale = chartHeight / (maxAmount || 1);

      // 绘制坐标轴
      ctx.strokeStyle = '#E9ECEF';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(padding, padding);
      ctx.lineTo(padding, height - padding);
      ctx.lineTo(width - padding, height - padding);
      ctx.stroke();

      // 绘制柱状图
      barChart.forEach((item, index) => {
        const x = padding + index * (chartWidth / barChart.length) + (chartWidth / barChart.length - barWidth) / 2;
        const barHeight = item.amount * scale;
        const y = height - padding - barHeight;

        ctx.fillStyle = '#28A745';
        ctx.fillRect(x, y, barWidth, barHeight);

        // 绘制数值标签
        ctx.font = '10px sans-serif';
        ctx.fillStyle = '#333';
        ctx.textAlign = 'center';
        ctx.fillText(item.amount.toFixed(0), x + barWidth / 2, y - 5);

        // 绘制日期标签
        ctx.font = '10px sans-serif';
        ctx.fillStyle = '#666';
        ctx.fillText(item.date, x + barWidth / 2, height - padding + 15);
      });
    });
  },

  // 自定义日期选择
  onCustomDateChange(e) {
    this.setData({
      customDate: e.detail.value
    });
    this.loadStatistics();
  },

  // 趋势类型切换
  onTrendTypeChange(e) {
    const type = e.currentTarget.dataset.type;
    this.setData({
      trendType: type
    });
    this.generateCharts();
  },

  // 切换详细显示
  onToggleDetail() {
    this.setData({
      showDetail: !this.data.showDetail
    });
  },

  // 查看详细记录
  onViewDetails() {
    wx.navigateTo({
      url: '/pages/accounting/record?filter=all'
    });
  },

  // 刷新数据
  onRefreshData() {
    this.loadStatistics();
  },

  // 分享报告
  onShareReport() {
    wx.showToast({
      title: '分享功能开发中',
      icon: 'none'
    });
  },



  // 导出数据
  onExportData() {
    wx.showLoading({
      title: '准备导出...'
    });

    // 这里可以调用云函数生成Excel文件
    wx.cloud.callFunction({
      name: 'quickstartFunctions',
      data: {
        type: 'exportRecords',
        timeRange: this.data.timeRange
      }
    }).then(res => {
      wx.hideLoading();
      if (res.result.fileUrl) {
        wx.showModal({
          title: '导出成功',
          content: '数据已导出到云存储，是否下载？',
          success: (modalRes) => {
            if (modalRes.confirm) {
              wx.downloadFile({
                url: res.result.fileUrl,
                success: (downloadRes) => {
                  wx.saveFile({
                    tempFilePath: downloadRes.tempFilePath,
                    success: () => {
                      wx.showToast({
                        title: '保存成功',
                        icon: 'success'
                      });
                    }
                  });
                }
              });
            }
          }
        });
      }
    }).catch(err => {
      wx.hideLoading();
      wx.showToast({
        title: '导出失败',
        icon: 'none'
      });
    });
  }
});