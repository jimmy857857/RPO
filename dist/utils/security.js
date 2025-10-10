// 安全工具类
class SecurityUtils {
  constructor() {
    this.sensitiveFields = ['password', 'token', 'openid', 'unionid', 'phone', 'idCard'];
  }

  // 数据脱敏处理
  desensitize(data, fields = this.sensitiveFields) {
    if (typeof data !== 'object' || data === null) {
      return data;
    }

    const result = Array.isArray(data) ? [] : {};

    for (const [key, value] of Object.entries(data)) {
      if (fields.includes(key) && value) {
        // 对敏感字段进行脱敏
        result[key] = this.maskSensitiveData(value);
      } else if (typeof value === 'object' && value !== null) {
        // 递归处理嵌套对象
        result[key] = this.desensitize(value, fields);
      } else {
        result[key] = value;
      }
    }

    return result;
  }

  // 敏感数据掩码处理
  maskSensitiveData(value) {
    const str = String(value);
    
    if (str.length <= 2) {
      return '*'.repeat(str.length);
    }
    
    if (str.length <= 6) {
      return str.charAt(0) + '*'.repeat(str.length - 2) + str.charAt(str.length - 1);
    }
    
    // 手机号：138****1234
    if (/^1[3-9]\d{9}$/.test(str)) {
      return str.substring(0, 3) + '****' + str.substring(7);
    }
    
    // 身份证号：1101**********1234
    if (/(^\d{15}$)|(^\d{18}$)|(^\d{17}(\d|X|x)$)/.test(str)) {
      return str.substring(0, 6) + '********' + str.substring(14);
    }
    
    // 邮箱：te****@example.com
    if (/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(str)) {
      const [local, domain] = str.split('@');
      if (local.length <= 2) {
        return '*'.repeat(local.length) + '@' + domain;
      }
      return local.substring(0, 2) + '****' + '@' + domain;
    }
    
    // 默认掩码处理
    return str.substring(0, 2) + '****' + str.substring(str.length - 2);
  }

  // XSS防护
  sanitizeHtml(html) {
    if (typeof html !== 'string') return html;
    
    // 移除危险标签和属性
    return html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
      .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
      .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '')
      .replace(/on\w+="[^"]*"/gi, '')
      .replace(/on\w+='[^']*'/gi, '')
      .replace(/javascript:/gi, '');
  }

  // SQL注入防护
  sanitizeSql(input) {
    if (typeof input !== 'string') return input;
    
    // 移除SQL关键字和特殊字符
    const sqlKeywords = [
      'select', 'insert', 'update', 'delete', 'drop', 'create', 'alter',
      'union', 'where', 'and', 'or', 'like', 'exec', 'execute', 'script'
    ];
    
    let sanitized = input.toLowerCase();
    sqlKeywords.forEach(keyword => {
      const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
      sanitized = sanitized.replace(regex, '');
    });
    
    // 移除特殊字符
    sanitized = sanitized.replace(/[;'"\\]/g, '');
    
    return sanitized;
  }

  // 输入验证
  validateInput(input, rules) {
    const errors = [];
    
    if (rules.required && (!input && input !== 0)) {
      errors.push('该字段为必填项');
      return errors;
    }
    
    if (input) {
      const str = String(input);
      
      if (rules.minLength && str.length < rules.minLength) {
        errors.push(`长度不能少于${rules.minLength}个字符`);
      }
      
      if (rules.maxLength && str.length > rules.maxLength) {
        errors.push(`长度不能超过${rules.maxLength}个字符`);
      }
      
      if (rules.pattern && !rules.pattern.test(str)) {
        errors.push('格式不正确');
      }
      
      if (rules.type === 'number' && isNaN(parseFloat(str))) {
        errors.push('必须为数字');
      }
      
      if (rules.type === 'email' && !/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(str)) {
        errors.push('邮箱格式不正确');
      }
      
      if (rules.type === 'phone' && !/^1[3-9]\d{9}$/.test(str)) {
        errors.push('手机号格式不正确');
      }
    }
    
    return errors;
  }

  // 加密存储（简单base64编码，生产环境应使用更安全的加密方式）
  encrypt(data) {
    if (typeof data === 'object') {
      data = JSON.stringify(data);
    }
    return wx.base64.encode(data);
  }

  // 解密存储
  decrypt(encryptedData) {
    try {
      const decoded = wx.base64.decode(encryptedData);
      return JSON.parse(decoded);
    } catch (error) {
      console.error('解密失败:', error);
      return null;
    }
  }

  // 检查敏感操作频率（防刷）
  checkOperationFrequency(operationKey, maxFrequency = 10, timeWindow = 60000) {
    const now = Date.now();
    const key = `frequency_${operationKey}`;
    const history = wx.getStorageSync(key) || [];
    
    // 清理过期记录
    const validHistory = history.filter(time => now - time < timeWindow);
    
    if (validHistory.length >= maxFrequency) {
      return false; // 频率过高
    }
    
    // 记录当前操作
    validHistory.push(now);
    wx.setStorageSync(key, validHistory);
    
    return true;
  }
}

module.exports = new SecurityUtils();