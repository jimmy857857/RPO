// pages/accounting/record.js
Page({
  data: {
    amount: '',
    recordType: 'expense',
    selectedCategory: '',
    note: '',
    recordDate: '',
    paymentMethods: ['微信支付', '支付宝', '现金', '银行卡', '信用卡'],
    paymentIndex: 0,
    receiptImage: '',
    categories: [
      { id: '餐饮', name: '餐饮', icon: '🍽️', type: 'expense' },
      { id: '交通', name: '交通', icon: '🚗', type: 'expense' },
      { id: '购物', name: '购物', icon: '🛍️', type: 'expense' },
      { id: '娱乐', name: '娱乐', icon: '🎮', type: 'expense' },
      { id: '医疗', name: '医疗', icon: '🏥', type: 'expense' },
      { id: '教育', name: '教育', icon: '📚', type: 'expense' },
      { id: '住房', name: '住房', icon: '🏠', type: 'expense' },
      { id: '通讯', name: '通讯', icon: '📱', type: 'expense' },
      { id: '工资', name: '工资', icon: '💰', type: 'income' },
      { id: '奖金', name: '奖金', icon: '🎁', type: 'income' },
      { id: '投资', name: '投资', icon: '📈', type: 'income' },
      { id: '其他', name: '其他', icon: '📦', type: 'both' }
    ],
    quickAmounts: [10, 20, 50, 100, 200, 500],
    canSave: false
  },

  onLoad() {
    this.setCurrentDateTime();
  },

  // 设置当前日期时间
  setCurrentDateTime() {
    const now = new Date();
    const date = now.toISOString().split('T')[0];
    
    this.setData({
      recordDate: date
    });
  },

  // 金额输入
  onAmountInput(e) {
    let value = e.detail.value.replace(/[^\d.]/g, '');
    if (value.includes('.')) {
      const parts = value.split('.');
      if (parts[1].length > 2) {
        value = parts[0] + '.' + parts[1].slice(0, 2);
      }
    }
    this.setData({
      amount: value
    });
  },

  // 类型切换
  onTypeChange(e) {
    const type = e.currentTarget.dataset.type;
    this.setData({
      recordType: type,
      selectedCategory: '' // 切换类型时清空分类选择
    });
  },

  // 选择分类
  onCategorySelect(e) {
    const category = e.currentTarget.dataset.category;
    this.setData({
      selectedCategory: category
    });
  },

  // 备注输入
  onNoteInput(e) {
    this.setData({
      note: e.detail.value
    });
  },

  // 日期选择
  onDateChange(e) {
    this.setData({
      recordDate: e.detail.value
    });
  },

  // 支付方式选择
  onPaymentChange(e) {
    this.setData({
      paymentIndex: e.detail.value
    });
  },

  // 时间选择
  onTimeChange(e) {
    this.setData({
      time: e.detail.value
    });
  },

  // 显示分类选择器
  showCategoryPicker() {
    this.setData({
      showCategoryPicker: true
    });
  },

  // 显示日期选择器
  showDatePicker() {
    this.setData({
      showDatePicker: true
    });
  },

  // 隐藏选择器
  hidePickers() {
    this.setData({
      showCategoryPicker: false,
      showDatePicker: false
    });
  },

  // 快速金额输入
  onQuickAmountSelect(e) {
    const amount = e.currentTarget.dataset.amount;
    this.setData({
      amount: amount.toString(),
      canSave: amount && this.data.selectedCategory
    });
  },

  // 保存记录
  onSaveRecord() {
    if (!this.data.amount || parseFloat(this.data.amount) <= 0) {
      wx.showToast({
        title: '请输入有效金额',
        icon: 'none'
      });
      return;
    }

    if (!this.data.selectedCategory) {
      wx.showToast({
        title: '请选择分类',
        icon: 'none'
      });
      return;
    }

    wx.showLoading({
      title: '保存中...'
    });

    const db = wx.cloud.database();
    const dateTime = new Date(this.data.recordDate);
    
    db.collection('records').add({
      data: {
        amount: parseFloat(this.data.amount),
        type: this.data.recordType,
        category: this.data.selectedCategory,
        note: this.data.note,
        paymentMethod: this.data.paymentMethods[this.data.paymentIndex],
        date: dateTime,
        createdTime: new Date()
      }
    }).then(res => {
      wx.hideLoading();
      wx.showToast({
        title: '记录成功',
        icon: 'success'
      });
      
      // 清空表单
      this.setData({
        amount: '',
        note: '',
        receiptImage: ''
      });
      this.setCurrentDateTime();
      
      // 返回首页并刷新数据
      setTimeout(() => {
        wx.switchTab({
          url: '/pages/index/index'
        });
        
        // 通过getCurrentPages获取首页实例并刷新数据
        setTimeout(() => {
          const pages = getCurrentPages();
          const indexPage = pages.find(page => page.route === 'pages/index/index');
          if (indexPage && indexPage.loadBudgetData) {
            indexPage.loadBudgetData();
            indexPage.loadRecentRecords();
          }
        }, 500);
      }, 1500);
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
          title: '保存失败',
          icon: 'none'
        });
      }
      console.error('保存记录失败:', err);
    });
  },

  // 上传凭证图片
  onUploadReceipt() {
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const tempFilePath = res.tempFilePaths[0];
        wx.showLoading({
          title: '上传中...'
        });
        
        // 上传到云存储
        wx.cloud.uploadFile({
          cloudPath: 'receipts/' + Date.now() + '.jpg',
          filePath: tempFilePath,
          success: (uploadRes) => {
            wx.hideLoading();
            this.setData({
              receiptImage: uploadRes.fileID
            });
            wx.showToast({
              title: '上传成功',
              icon: 'success'
            });
          },
          fail: (err) => {
            wx.hideLoading();
            wx.showToast({
              title: '上传失败',
              icon: 'none'
            });
            console.error('上传失败:', err);
          }
        });
      }
    });
  },

  // 移除图片
  onRemoveImage() {
    this.setData({
      receiptImage: ''
    });
  },



  // 金额输入时检查是否可以保存
  onAmountInput(e) {
    let value = e.detail.value.replace(/[^\d.]/g, '');
    if (value.includes('.')) {
      const parts = value.split('.');
      if (parts[1].length > 2) {
        value = parts[0] + '.' + parts[1].slice(0, 2);
      }
    }
    this.setData({
      amount: value,
      canSave: value && this.data.selectedCategory
    });
  },

  // 备注输入
  onNoteInput(e) {
    this.setData({
      note: e.detail.value
    });
  },

  // 取消
  onCancel() {
    wx.navigateBack();
  }
});