// pages/accounting/budget.js
Page({
  data: {
    // 预算概览数据
    totalBudget: 0,
    budgetUsed: 0,
    budgetRemaining: 0,
    budgetProgress: 0,
    budgetStatus: 'normal',
    budgetStatusText: '正常',
    
    // 分类预算数据
    categoryBudgets: [
      { category: '餐饮', name: '餐饮', icon: '🍽️', budgetAmount: 0, usedAmount: 0, progress: 0 },
      { category: '交通', name: '交通', icon: '🚗', budgetAmount: 0, usedAmount: 0, progress: 0 },
      { category: '购物', name: '购物', icon: '🛍️', budgetAmount: 0, usedAmount: 0, progress: 0 },
      { category: '娱乐', name: '娱乐', icon: '🎮', budgetAmount: 0, usedAmount: 0, progress: 0 },
      { category: '医疗', name: '医疗', icon: '🏥', budgetAmount: 0, usedAmount: 0, progress: 0 },
      { category: '教育', name: '教育', icon: '📚', budgetAmount: 0, usedAmount: 0, progress: 0 },
      { category: '住房', name: '住房', icon: '🏠', budgetAmount: 0, usedAmount: 0, progress: 0 },
      { category: '通讯', name: '通讯', icon: '📱', budgetAmount: 0, usedAmount: 0, progress: 0 }
    ],
    
    // 预算提醒设置
    totalReminder: { enabled: true, threshold: 80 },
    categoryReminder: { enabled: true, threshold: 80 },
    
    // 预算历史
    budgetHistory: [],
    
    // 智能推荐
    showRecommend: false,
    recommendations: []
  },

  onLoad() {
    this.loadBudgetData();
  },

  onShow() {
    this.loadBudgetData();
  },

  onReady() {
    // 页面渲染完成后绘制图表
    setTimeout(() => {
    }, 500);
  },

  // 加载预算数据
  loadBudgetData() {
    const db = wx.cloud.database();
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;

    // 获取月度总预算
    db.collection('budgets').where({
      year: year,
      month: month,
      type: 'total'
    }).get().then(res => {
      let totalBudget = 0;
      if (res.data.length > 0) {
        totalBudget = res.data[0].amount || 0;
      }
      
      this.setData({
        totalBudget: totalBudget
      });
      
      return this.loadCategoryBudgets(year, month, totalBudget);
    }).then(() => {
      return this.loadCurrentExpenses(year, month);
    }).then(() => {
      this.calculateBudgetStatus();
    }).catch(err => {
      if (err.errCode === -502005) {
        console.log('数据库集合尚未创建，使用默认值');
        this.setData({
          totalBudget: 0,
          budgetUsed: 0,
          budgetRemaining: 0,
          budgetProgress: 0,
          budgetStatus: 'normal',
          budgetStatusText: '正常'
        });
      } else {
        console.error('加载预算数据失败:', err);
      }
    });
  },

  // 加载分类预算
  loadCategoryBudgets(year, month, totalBudget) {
    const db = wx.cloud.database();
    return new Promise((resolve, reject) => {
      db.collection('budgets').where({
        year: year,
        month: month,
        type: 'category'
      }).get().then(res => {
        const categoryBudgets = this.data.categoryBudgets.map(cat => {
          const budgetRecord = res.data.find(b => b.category === cat.category);
          return {
            ...cat,
            budgetAmount: budgetRecord ? budgetRecord.amount : 0
          };
        });
        
        this.setData({
          categoryBudgets: categoryBudgets
        });
        resolve();
      }).catch(err => {
        if (err.errCode === -502005) {
          // budgets集合不存在，使用默认值
          console.log('budgets集合尚未创建，使用默认分类预算');
          resolve();
        } else {
          reject(err);
        }
      });
    });
  },

  // 加载当前支出
  loadCurrentExpenses(year, month) {
    const db = wx.cloud.database();
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    return new Promise((resolve, reject) => {
      db.collection('records').where({
        type: 'expense',
        date: db.command.gte(startDate).and(db.command.lte(endDate))
      }).get().then(res => {
        const categoryExpenses = {};
        let totalExpense = 0;
        
        res.data.forEach(record => {
          if (!categoryExpenses[record.category]) {
            categoryExpenses[record.category] = 0;
          }
          categoryExpenses[record.category] += record.amount;
          totalExpense += record.amount;
        });

        const categoryBudgets = this.data.categoryBudgets.map(cat => {
          const usedAmount = categoryExpenses[cat.name] || 0;
          const progress = cat.budgetAmount > 0 ? 
            Math.min(100, (usedAmount / cat.budgetAmount) * 100) : 0;
            
          return {
            ...cat,
            usedAmount: usedAmount,
            progress: Math.round(progress)
          };
        });

        const totalBudget = this.data.totalBudget || 0;
        const budgetRemaining = Math.max(0, totalBudget - totalExpense);
        const budgetProgress = totalBudget > 0 ? 
          Math.min(100, (totalExpense / totalBudget) * 100) : 0;

        this.setData({
          categoryBudgets: categoryBudgets,
          budgetUsed: totalExpense,
          budgetRemaining: budgetRemaining,
          budgetProgress: Math.round(budgetProgress)
        });
        
        resolve();
      }).catch(err => {
        if (err.errCode === -502005) {
          // records集合不存在，使用默认值
          console.log('records集合尚未创建，使用默认支出数据');
          
          const categoryBudgets = this.data.categoryBudgets.map(cat => ({
            ...cat,
            usedAmount: 0,
            progress: 0
          }));
          
          this.setData({
            categoryBudgets: categoryBudgets,
            budgetUsed: 0,
            budgetRemaining: this.data.totalBudget || 0,
            budgetProgress: 0
          });
          
          resolve();
        } else {
          reject(err);
        }
      });
    });
  },



  // 计算预算状态
  calculateBudgetStatus() {
    const progress = this.data.budgetProgress;
    let status = 'normal';
    let statusText = '正常';
    
    if (progress >= 90) {
      status = 'danger';
      statusText = '超支';
    } else if (progress >= 70) {
      status = 'warning';
      statusText = '预警';
    }
    
    this.setData({
      budgetStatus: status,
      budgetStatusText: statusText
    });
  },

  // 总预算输入变化
  onTotalBudgetChange(e) {
    const value = e.detail.value;
    const amount = parseFloat(value) || 0;
    
    this.setData({
      totalBudget: amount
    });
    
    // 重新计算相关数据
    const budgetUsed = this.data.budgetUsed || 0;
    const budgetRemaining = Math.max(0, amount - budgetUsed);
    const budgetProgress = amount > 0 ? Math.min(100, (budgetUsed / amount) * 100) : 0;
    
    this.setData({
      budgetRemaining: budgetRemaining,
      budgetProgress: Math.round(budgetProgress)
    });
    
    this.calculateBudgetStatus();
  },

  // 分类预算输入变化
  onCategoryBudgetChange(e) {
    const value = e.detail.value;
    const category = e.currentTarget.dataset.category;
    const amount = parseFloat(value) || 0;
    
    const categoryBudgets = this.data.categoryBudgets.map(cat => {
      if (cat.category === category) {
        const progress = amount > 0 ? 
          Math.min(100, (cat.usedAmount / amount) * 100) : 0;
        return {
          ...cat,
          budgetAmount: amount,
          progress: Math.round(progress)
        };
      }
      return cat;
    });
    
    this.setData({
      categoryBudgets: categoryBudgets
    });
  },

  // 保存预算设置
  onSaveBudget() {
    wx.showLoading({
      title: '保存中...'
    });

    const db = wx.cloud.database();
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    
    const savePromises = [];
    
    // 保存总预算
    if (this.data.totalBudget > 0) {
      savePromises.push(
        this.saveBudgetRecord('total', null, this.data.totalBudget, year, month)
      );
    }
    
    // 保存分类预算
    this.data.categoryBudgets.forEach(cat => {
      if (cat.budgetAmount > 0) {
        savePromises.push(
          this.saveBudgetRecord('category', cat.category, cat.budgetAmount, year, month)
        );
      }
    });
    
    Promise.all(savePromises).then(() => {
      wx.hideLoading();
      wx.showToast({
        title: '保存成功',
        icon: 'success'
      });
    }).catch(err => {
      wx.hideLoading();
      wx.showToast({
        title: '保存失败',
        icon: 'none'
      });
      console.error('保存预算失败:', err);
    });
  },

  // 保存单个预算记录
  saveBudgetRecord(type, category, amount, year, month) {
    const db = wx.cloud.database();
    
    let query = {
      year: year,
      month: month,
      type: type
    };
    
    if (type === 'category') {
      query.category = category;
    }
    
    return db.collection('budgets').where(query).get().then(res => {
      if (res.data.length > 0) {
        // 更新现有记录
        return db.collection('budgets').doc(res.data[0]._id).update({
          data: {
            amount: amount,
            updatedTime: new Date()
          }
        });
      } else {
        // 创建新记录
        return db.collection('budgets').add({
          data: {
            type: type,
            category: category,
            amount: amount,
            year: year,
            month: month,
            createdTime: new Date(),
            updatedTime: new Date()
          }
        });
      }
    });
  },

  // 重置预算
  onResetBudget() {
    wx.showModal({
      title: '重置预算',
      content: '确定要重置所有预算设置吗？',
      success: (res) => {
        if (res.confirm) {
          this.resetAllBudgets();
        }
      }
    });
  },

  // 重置所有预算
  resetAllBudgets() {
    wx.showLoading({
      title: '重置中...'
    });

    const db = wx.cloud.database();
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;

    // 删除当前月的所有预算记录
    db.collection('budgets').where({
      year: year,
      month: month
    }).get().then(res => {
      const deletePromises = res.data.map(record => 
        db.collection('budgets').doc(record._id).remove()
      );
      return Promise.all(deletePromises);
    }).then(() => {
      wx.hideLoading();
      wx.showToast({
        title: '重置成功',
        icon: 'success'
      });
      
      // 重置本地数据
      this.setData({
        totalBudget: 0,
        budgetUsed: 0,
        budgetRemaining: 0,
        budgetProgress: 0,
        budgetStatus: 'normal',
        budgetStatusText: '正常',
        categoryBudgets: this.data.categoryBudgets.map(cat => ({
          ...cat,
          budgetAmount: 0,
          usedAmount: 0,
          progress: 0
        }))
      });
      
    }).catch(err => {
      wx.hideLoading();
      wx.showToast({
        title: '重置失败',
        icon: 'none'
      });
      console.error('重置预算失败:', err);
    });
  },

  // 保存预算
  saveBudget(type, category, amount) {
    wx.showLoading({
      title: '保存中...'
    });

    const db = wx.cloud.database();
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;

    // 检查是否已存在预算记录
    let query = {
      year: year,
      month: month,
      type: type
    };
    
    if (type === 'category') {
      query.category = category;
    }

    db.collection('budgets').where(query).get().then(res => {
      if (res.data.length > 0) {
        // 更新现有记录
        return db.collection('budgets').doc(res.data[0]._id).update({
          data: {
            amount: amount,
            updatedTime: new Date()
          }
        });
      } else {
        // 创建新记录
        return db.collection('budgets').add({
          data: {
            type: type,
            category: category,
            amount: amount,
            year: year,
            month: month,
            createdTime: new Date(),
            updatedTime: new Date()
          }
        });
      }
    }).then(() => {
      wx.hideLoading();
      wx.showToast({
        title: '保存成功',
        icon: 'success'
      });
      this.loadBudgetData();
    }).catch(err => {
      wx.hideLoading();
      wx.showToast({
        title: '保存失败',
        icon: 'none'
      });
      console.error('保存预算失败:', err);
    });
  },

  // 计算预算使用率
  calculateUsageRate(current, budget) {
    if (!budget || budget === 0) return 0;
    return Math.min(100, (current / budget) * 100);
  },

  // 获取预算状态颜色
  getBudgetStatusColor(usageRate) {
    if (usageRate < 70) return '#28A745';
    if (usageRate < 90) return '#FFA500';
    return '#FF6B6B';
  },

  // 查看预算详情
  onViewBudgetDetail(e) {
    const category = e.currentTarget.dataset.category;
    const budget = this.data.categoryBudgets[category] || 0;
    const current = this.data.categories.find(cat => cat.name === category)?.current || 0;
    const usageRate = this.calculateUsageRate(current, budget);

    wx.showModal({
      title: `${category}预算详情`,
      content: `预算：${budget}元\n已用：${current}元\n使用率：${usageRate.toFixed(1)}%`,
      showCancel: false
    });
  },

  // 重置预算
  onResetBudget() {
    wx.showModal({
      title: '重置预算',
      content: '确定要重置所有预算设置吗？',
      success: (res) => {
        if (res.confirm) {
          this.resetAllBudgets();
        }
      }
    });
  },

  // 重置所有预算
  resetAllBudgets() {
    wx.showLoading({
      title: '重置中...'
    });

    const db = wx.cloud.database();
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;

    // 删除当前月的所有预算记录
    db.collection('budgets').where({
      year: year,
      month: month
    }).get().then(res => {
      const deletePromises = res.data.map(record => 
        db.collection('budgets').doc(record._id).remove()
      );
      return Promise.all(deletePromises);
    }).then(() => {
      wx.hideLoading();
      wx.showToast({
        title: '重置成功',
        icon: 'success'
      });
      this.loadBudgetData();
    }).catch(err => {
      wx.hideLoading();
      wx.showToast({
        title: '重置失败',
        icon: 'none'
      });
      console.error('重置预算失败:', err);
    });
  },

  // 查看历史记录
  onViewHistory() {
    wx.navigateTo({
      url: '/pages/accounting/statistics'
    });
  },

  // 保存预算设置
  onSaveBudget() {
    wx.showLoading({
      title: '保存中...'
    });

    const db = wx.cloud.database();
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;

    // 保存总预算
    const saveTotalBudget = this.saveBudgetRecord('total', null, this.data.totalBudget, year, month);

    // 保存分类预算
    const saveCategoryBudgets = Object.keys(this.data.categoryBudgets).map(category => 
      this.saveBudgetRecord('category', category, this.data.categoryBudgets[category], year, month)
    );

    Promise.all([saveTotalBudget, ...saveCategoryBudgets])
      .then(() => {
        wx.hideLoading();
        wx.showToast({
          title: '保存成功',
          icon: 'success'
        });
      })
      .catch(err => {
        wx.hideLoading();
        wx.showToast({
          title: '保存失败',
          icon: 'none'
        });
        console.error('保存预算失败:', err);
      });
  }
});