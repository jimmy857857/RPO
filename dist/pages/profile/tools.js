// pages/profile/tools.js
Page({
  data: {
    tools: [
      {
        id: 'calculator',
        name: '计算器',
        icon: '🧮',
        desc: '简单实用的计算器'
      },
      {
        id: 'currency',
        name: '汇率换算',
        icon: '💱',
        desc: '实时汇率换算工具'
      },
      {
        id: 'split',
        name: 'AA制分摊',
        icon: '👥',
        desc: '多人聚餐费用分摊计算'
      },
      {
        id: 'tip',
        name: '小费计算',
        icon: '💸',
        desc: '餐厅小费快速计算'
      },
      {
        id: 'loan',
        name: '贷款计算',
        icon: '🏦',
        desc: '房贷、车贷计算器'
      },
      {
        id: 'tax',
        name: '税费计算',
        icon: '📊',
        desc: '个人所得税计算'
      }
    ],
    currentTool: 'calculator',
    showOtherTools: false,
    calculator: {
      display: '0',
      currentInput: '',
      operator: '',
      previousValue: 0
    },
    currency: {
      fromCurrency: 'CNY',
      toCurrency: 'USD',
      amount: '1',
      rate: 0.14,
      result: '0.14',
      updateTime: '刚刚'
    },
    split: {
      totalAmount: '',
      peopleCount: '2',
      includeTax: false,
      taxRate: '10',
      taxAmount: '0.00',
      tipAmount: '',
      result: 0
    }
  },

  onLoad() {
    this.initCalculator()
  },

  // 初始化计算器
  initCalculator() {
    this.setData({
      calculator: {
        display: '0',
        currentInput: '',
        operator: '',
        previousValue: 0
      }
    })
  },

  // 切换工具
  onToolChange(e) {
    const toolId = e.currentTarget.dataset.tool
    const showOtherTools = !['calculator', 'currency', 'split'].includes(toolId)
    this.setData({
      currentTool: toolId,
      showOtherTools: showOtherTools
    })
  },

  // 计算器功能
  onCalculatorInput(e) {
    const value = e.currentTarget.dataset.value
    let { display, currentInput, operator, previousValue } = this.data.calculator

    if ('0123456789'.includes(value)) {
      // 数字输入
      if (currentInput === '0' || operator) {
        currentInput = value
      } else {
        currentInput += value
      }
      display = currentInput
    } else if (value === '.') {
      // 小数点
      if (!currentInput.includes('.')) {
        currentInput += '.'
        display = currentInput
      }
    } else if ('+-*/'.includes(value)) {
      // 运算符
      if (operator) {
        // 连续运算
        const result = this.calculate(previousValue, parseFloat(currentInput), operator)
        display = result.toString()
        previousValue = result
      } else {
        previousValue = parseFloat(currentInput)
      }
      operator = value
      currentInput = ''
    } else if (value === '=') {
      // 等于
      if (operator && currentInput) {
        const result = this.calculate(previousValue, parseFloat(currentInput), operator)
        display = result.toString()
        previousValue = result
        operator = ''
        currentInput = display
      }
    } else if (value === 'C') {
      // 清除
      this.initCalculator()
      return
    } else if (value === 'CE') {
      // 清除当前输入
      currentInput = '0'
      display = '0'
    }

    this.setData({
      calculator: {
        display,
        currentInput,
        operator,
        previousValue
      }
    })
  },

  // 计算函数
  calculate(a, b, operator) {
    switch (operator) {
      case '+': return a + b
      case '-': return a - b
      case '*': return a * b
      case '/': return b !== 0 ? a / b : 0
      default: return b
    }
  },

  // 汇率换算
  onCurrencyInput(e) {
    const field = e.currentTarget.dataset.field
    const value = e.detail.value
    const { currency } = this.data

    currency[field] = value

    if (field === 'amount' || field === 'rate') {
      const result = (parseFloat(currency.amount) || 0) * (parseFloat(currency.rate) || 0)
      currency.result = result.toFixed(2)
    }

    // 更新时间
    const now = new Date()
    currency.updateTime = `${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}`

    this.setData({ currency })
  },

  // 切换货币
  onCurrencySwitch() {
    const { currency } = this.data
    const temp = currency.fromCurrency
    currency.fromCurrency = currency.toCurrency
    currency.toCurrency = temp
    
    // 这里应该调用API获取实时汇率，暂时使用固定值
    const rates = {
      'CNY-USD': 0.14,
      'USD-CNY': 7.0,
      'CNY-EUR': 0.13,
      'EUR-CNY': 7.7,
      'USD-EUR': 0.92,
      'EUR-USD': 1.09
    }
    
    const rateKey = `${currency.fromCurrency}-${currency.toCurrency}`
    currency.rate = rates[rateKey] || 1
    const result = (parseFloat(currency.amount) || 0) * currency.rate
    currency.result = result.toFixed(2)
    
    // 更新时间
    const now = new Date()
    currency.updateTime = `${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}`

    this.setData({ currency })
  },

  // AA制分摊计算
  onSplitInput(e) {
    const field = e.currentTarget.dataset.field
    const value = e.detail.value
    const { split } = this.data

    split[field] = value
    this.calculateSplit()

    this.setData({ split })
  },

  // 计算分摊结果
  calculateSplit() {
    const { split } = this.data
    let total = parseFloat(split.totalAmount) || 0
    const people = parseInt(split.peopleCount) || 1

    // 处理税费
    let taxAmount = 0
    if (split.includeTax) {
      const taxRate = parseFloat(split.taxRate) || 0
      taxAmount = total * (taxRate / 100)
      total += taxAmount
    }

    // 处理小费
    if (split.tipAmount) {
      const tip = parseFloat(split.tipAmount) || 0
      total += tip
    }

    split.result = (total / people).toFixed(2)
    split.taxAmount = taxAmount.toFixed(2)

    this.setData({ split })
  },

  // 切换包含税费
  onTaxToggle(e) {
    const { split } = this.data
    split.includeTax = e.detail.value
    this.calculateSplit()
    this.setData({ split })
  },

  // 小费计算
  onTipInput(e) {
    const value = e.detail.value
    const { split } = this.data
    split.tipAmount = value
    this.calculateSplit()
    this.setData({ split })
  },

  // 分享工具
  onShareTool() {
    const tool = this.data.tools.find(t => t.id === this.data.currentTool)
    wx.showShareMenu({
      withShareTicket: true
    })
  },

  // 页面分享
  onShareAppMessage() {
    const tool = this.data.tools.find(t => t.id === this.data.currentTool)
    return {
      title: `${tool.name} - 实用小工具`,
      path: `/pages/profile/tools?tool=${this.data.currentTool}`
    }
  }
})