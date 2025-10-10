// 常量定义
module.exports = {
  // 小程序信息
  APP_INFO: {
    name: '记账游戏助手',
    version: '1.0.0',
    description: '轻量化记账管理 + 即时性聚会游戏'
  },

  // 记账相关常量
  ACCOUNTING: {
    // 分类类型
    CATEGORY_TYPES: {
      EXPENSE: 'expense',
      INCOME: 'income',
      BOTH: 'both'
    },

    // 支付方式
    PAYMENT_METHODS: ['微信支付', '支付宝', '现金', '银行卡', '信用卡', '其他'],

    // 快速金额
    QUICK_AMOUNTS: [10, 20, 50, 100, 200, 500],

    // 默认分类
    DEFAULT_CATEGORIES: [
      { id: 'food', name: '餐饮', icon: '🍽️', type: 'expense' },
      { id: 'transport', name: '交通', icon: '🚗', type: 'expense' },
      { id: 'shopping', name: '购物', icon: '🛍️', type: 'expense' },
      { id: 'entertainment', name: '娱乐', icon: '🎮', type: 'expense' },
      { id: 'medical', name: '医疗', icon: '🏥', type: 'expense' },
      { id: 'education', name: '教育', icon: '📚', type: 'expense' },
      { id: 'housing', name: '住房', icon: '🏠', type: 'expense' },
      { id: 'utilities', name: '水电', icon: '💡', type: 'expense' },
      { id: 'communication', name: '通讯', icon: '📱', type: 'expense' },
      { id: 'salary', name: '工资', icon: '💰', type: 'income' },
      { id: 'bonus', name: '奖金', icon: '🎁', type: 'income' },
      { id: 'investment', name: '投资', icon: '📈', type: 'income' },
      { id: 'other', name: '其他', icon: '📦', type: 'both' }
    ]
  },

  // 游戏相关常量
  GAMES: {
    // 转盘模板
    WHEEL_TEMPLATES: [
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
      }
    ],

    // 转盘颜色
    WHEEL_COLORS: [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', 
      '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F'
    ],

    // 问题类型
    QUESTION_TYPES: [
      { id: 'truth', name: '真心话', icon: '💖' },
      { id: 'dare', name: '大冒险', icon: '🔥' },
      { id: 'punishment', name: '惩罚', icon: '⚡' }
    ]
  },

  // 存储键名
  STORAGE_KEYS: {
    USER_INFO: 'userInfo',
    TOKEN: 'token',
    SETTINGS: 'appSettings',
    BACKUP_DATA: 'backupData'
  },

  // 正则表达式
  REGEX: {
    AMOUNT: /^\d+(\.\d{0,2})?$/, // 金额格式
    PHONE: /^1[3-9]\d{9}$/, // 手机号
    EMAIL: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/ // 邮箱
  },

  // 错误码
  ERROR_CODES: {
    DB_NOT_EXIST: -502005, // 数据库集合不存在
    NETWORK_ERROR: -1, // 网络错误
    PERMISSION_DENIED: -502003 // 权限不足
  }
};