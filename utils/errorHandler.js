// 错误处理工具
const constants = require('./constants.js');

class ErrorHandler {
  constructor() {
    this.errorMessages = {
      // 网络错误
      '-1': '网络连接失败，请检查网络设置',
      '-502005': '数据库未初始化，请联系管理员',
      '-502003': '权限不足，无法执行此操作',
      '-502004': '数据库操作失败',
      '-501001': '云函数调用失败',
      
      // 自定义错误码
      'USER_NOT_LOGIN': '用户未登录，请先登录',
      'DATA_NOT_FOUND': '数据不存在',
      'PARAM_INVALID': '参数格式错误',
      'OPERATION_FAILED': '操作失败，请重试'
    };
  }

  // 处理错误
  handleError(error, customMessage = '') {
    console.error('错误详情:', error);
    
    let message = customMessage;
    let code = '';
    
    if (error && error.errCode) {
      code = error.errCode.toString();
      message = this.errorMessages[code] || error.errMsg || '未知错误';
    } else if (error && error.errMsg) {
      message = error.errMsg;
    } else if (typeof error === 'string') {
      message = error;
    } else if (error && error.message) {
      message = error.message;
    }
    
    // 显示错误提示
    this.showError(message);
    
    return {
      success: false,
      code: code,
      message: message,
      originalError: error
    };
  }

  // 显示错误提示
  showError(message, duration = 2000) {
    wx.showToast({
      title: message,
      icon: 'none',
      duration: duration
    });
  }

  // 显示加载中
  showLoading(title = '加载中...') {
    wx.showLoading({
      title: title,
      mask: true
    });
  }

  // 隐藏加载
  hideLoading() {
    wx.hideLoading();
  }

  // 显示确认对话框
  showConfirm(title, content, confirmText = '确定', cancelText = '取消') {
    return new Promise((resolve) => {
      wx.showModal({
        title: title,
        content: content,
        confirmText: confirmText,
        cancelText: cancelText,
        success: (res) => {
          resolve(res.confirm);
        }
      });
    });
  }

  // 网络状态检查
  checkNetwork() {
    return new Promise((resolve) => {
      wx.getNetworkType({
        success: (res) => {
          resolve(res.networkType !== 'none');
        },
        fail: () => {
          resolve(false);
        }
      });
    });
  }

  // 数据库错误处理
  handleDatabaseError(error, operation = '操作') {
    if (error.errCode === constants.ERROR_CODES.DB_NOT_EXIST) {
      return this.handleError(error, '数据库未初始化，请先创建相关集合');
    }
    return this.handleError(error, `${operation}失败，请重试`);
  }

  // 云函数错误处理
  handleCloudFunctionError(error, functionName = '云函数') {
    if (error.errCode === constants.ERROR_CODES.PERMISSION_DENIED) {
      return this.handleError(error, '权限不足，无法执行此操作');
    }
    return this.handleError(error, `${functionName}调用失败`);
  }

  // 用户登录检查
  checkLoginStatus() {
    const app = getApp();
    if (!app.globalData.isLoggedIn) {
      this.showError('请先登录');
      return false;
    }
    return true;
  }

  // 数据验证
  validateData(data, rules) {
    const errors = [];
    
    for (const [field, rule] of Object.entries(rules)) {
      const value = data[field];
      
      if (rule.required && (!value && value !== 0)) {
        errors.push(`${field}不能为空`);
        continue;
      }
      
      if (value) {
        if (rule.type === 'number' && isNaN(parseFloat(value))) {
          errors.push(`${field}必须是数字`);
        }
        
        if (rule.type === 'email' && !constants.REGEX.EMAIL.test(value)) {
          errors.push(`${field}格式不正确`);
        }
        
        if (rule.type === 'phone' && !constants.REGEX.PHONE.test(value)) {
          errors.push(`${field}格式不正确`);
        }
        
        if (rule.min && parseFloat(value) < rule.min) {
          errors.push(`${field}不能小于${rule.min}`);
        }
        
        if (rule.max && parseFloat(value) > rule.max) {
          errors.push(`${field}不能大于${rule.max}`);
        }
      }
    }
    
    return errors;
  }
}

module.exports = new ErrorHandler();