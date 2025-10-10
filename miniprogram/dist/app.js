// app.js
const { errorHandler, performanceMonitor, updateManager } = require('./utils/index.js');

App({
  onLaunch() {
    // 记录启动时间
    performanceMonitor.startTime = Date.now();
    
    // 初始化云开发
    this.initCloud()

    // 检查登录状态
    this.checkLogin()

    // 获取系统信息
    this.getSystemInfo()

    // 初始化性能监控
    this.initPerformanceMonitor()

    // 初始化更新管理器
    this.initUpdateManager()

    // 检查隐私政策
    this.checkPrivacyPolicy()
  },

  onShow() {
    console.log('小程序启动完成，总耗时:', Date.now() - performanceMonitor.startTime);
  },

  // 初始化云开发环境
  initCloud() {
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力')
      return
    }

    // 使用动态环境，避免硬编码环境ID
    wx.cloud.init({
      env: wx.cloud.DYNAMIC_CURRENT_ENV,
      traceUser: true
    })
  },

  // 检查登录状态
  checkLogin() {
    const token = wx.getStorageSync('token')
    const userInfo = wx.getStorageSync('userInfo')

    if (token && userInfo) {
      this.globalData.userInfo = userInfo
      this.globalData.isLoggedIn = true
    } else {
      this.globalData.isLoggedIn = false
    }
  },

  // 获取系统信息
  getSystemInfo() {
    wx.getSystemInfo({
      success: (res) => {
        this.globalData.systemInfo = res
        this.globalData.isIPhoneX = /iphonex/gi.test(res.model)
        
        // 记录系统信息用于性能分析
        console.log('系统信息:', {
          platform: res.platform,
          version: res.version,
          system: res.system,
          screenWidth: res.screenWidth,
          screenHeight: res.screenHeight
        });
      },
      fail: (error) => {
        errorHandler.handleError(error, '获取系统信息失败');
      }
    })
  },

  // 初始化性能监控
  initPerformanceMonitor() {
    // 监控网络状态
    performanceMonitor.monitorNetworkStatus();
    
    // 定期检查内存使用情况
    setInterval(() => {
      performanceMonitor.monitorMemoryUsage();
    }, 30000);
  },

  // 检查隐私政策
  checkPrivacyPolicy() {
    const privacyAgreed = wx.getStorageSync('privacyAgreed');
    if (!privacyAgreed) {
      // 延迟显示隐私政策，避免影响用户体验
      setTimeout(() => {
        wx.navigateTo({
          url: '/pages/privacy/privacy'
        });
      }, 1000);
    }
  },

  // 初始化更新管理器
  initUpdateManager() {
    updateManager.init();
  },

  // 用户登录
  login(callback) {
    wx.login({
      success: (loginRes) => {
        if (loginRes.code) {
          // 发送 code 到后台换取 openId, sessionKey, unionId
          wx.cloud.callFunction({
            name: 'quickstartFunctions',
            data: {
              type: 'getOpenId'
            },
            success: (res) => {
              const { openid } = res.result
              this.globalData.openid = openid
              this.globalData.isLoggedIn = true
              
              // 保存登录状态
              wx.setStorageSync('token', openid)
              
              if (callback) callback(true)
            },
            fail: (err) => {
              console.error('登录失败:', err)
              if (callback) callback(false)
            }
          })
        } else {
          console.error('登录失败:', loginRes.errMsg)
          if (callback) callback(false)
        }
      }
    })
  },

  // 获取用户信息
  getUserInfo(callback) {
    wx.getUserProfile({
      desc: '用于完善会员资料',
      success: (res) => {
        const userInfo = res.userInfo
        this.globalData.userInfo = userInfo
        wx.setStorageSync('userInfo', userInfo)
        
        if (callback) callback(userInfo)
      },
      fail: (err) => {
        console.error('获取用户信息失败:', err)
        if (callback) callback(null)
      }
    })
  },

  // 检查网络状态
  checkNetwork() {
    return new Promise((resolve) => {
      wx.getNetworkType({
        success: (res) => {
          resolve(res.networkType !== 'none')
        },
        fail: () => {
          resolve(false)
        }
      })
    })
  },

  // 显示提示信息
  showToast(title, icon = 'none') {
    wx.showToast({
      title,
      icon,
      duration: 2000
    })
  },

  // 显示加载中
  showLoading(title = '加载中...') {
    wx.showLoading({
      title,
      mask: true
    })
  },

  // 隐藏加载中
  hideLoading() {
    wx.hideLoading()
  },

  globalData: {
    userInfo: null,
    openid: null,
    isLoggedIn: false,
    systemInfo: null,
    isIPhoneX: false,
    
    // 记账相关配置
    accountingConfig: {
      categories: [
        { id: 'food', name: '餐饮', icon: '🍽️' },
        { id: 'transport', name: '交通', icon: '🚗' },
        { id: 'shopping', name: '购物', icon: '🛍️' },
        { id: 'entertainment', name: '娱乐', icon: '🎮' },
        { id: 'medical', name: '医疗', icon: '🏥' },
        { id: 'education', name: '教育', icon: '📚' },
        { id: 'housing', name: '住房', icon: '🏠' },
        { id: 'utilities', name: '水电', icon: '💡' },
        { id: 'communication', name: '通讯', icon: '📱' },
        { id: 'clothing', name: '服饰', icon: '👔' },
        { id: 'beauty', name: '美容', icon: '💄' },
        { id: 'travel', name: '旅行', icon: '✈️' },
        { id: 'gift', name: '礼物', icon: '🎁' },
        { id: 'other', name: '其他', icon: '📦' }
      ],
      paymentMethods: ['微信支付', '支付宝', '现金', '银行卡', '信用卡', '其他'],
      quickAmounts: [10, 20, 50, 100, 200, 500]
    },

    // 游戏相关配置
    gamesConfig: {
      wheelTemplates: [
        {
          id: 'food',
          name: '美食选择',
          options: ['火锅', '烧烤', '日料', '西餐', '中餐', '快餐', '自助餐', '小吃']
        },
        {
          id: 'truth',
          name: '真心话',
          options: ['最近一次说谎', '最尴尬经历', '暗恋对象', '最疯狂的事']
        },
        {
          id: 'dare',
          name: '大冒险',
          options: ['模仿动物叫', '打电话说爱你', '跳段舞蹈', '做俯卧撑']
        },
        {
          id: 'punishment',
          name: '惩罚转盘',
          options: ['唱首歌', '讲笑话', '做鬼脸', '说绕口令']
        }
      ],
      wheelColors: [
        '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', 
        '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F'
      ]
    }
  }
})