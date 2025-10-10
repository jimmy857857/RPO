// 数据验证工具
const constants = require('./constants.js');

class DataValidator {
  constructor() {
    this.rules = {
      // 金额验证规则
      amount: {
        required: true,
        type: 'number',
        min: 0.01,
        max: 1000000,
        pattern: constants.REGEX.AMOUNT
      },
      
      // 分类验证规则
      category: {
        required: true,
        type: 'string',
        minLength: 1,
        maxLength: 20
      },
      
      // 备注验证规则
      note: {
        required: false,
        type: 'string',
        maxLength: 100
      },
      
      // 日期验证规则
      date: {
        required: true,
        type: 'date'
      },
      
      // 支付方式验证规则
      paymentMethod: {
        required: true,
        type: 'string',
        enum: constants.ACCOUNTING.PAYMENT_METHODS
      },
      
      // 用户昵称验证规则
      nickname: {
        required: false,
        type: 'string',
        minLength: 1,
        maxLength: 20
      },
      
      // 邮箱验证规则
      email: {
        required: false,
        type: 'email',
        pattern: constants.REGEX.EMAIL
      },
      
      // 手机号验证规则
      phone: {
        required: false,
        type: 'phone',
        pattern: constants.REGEX.PHONE
      }
    };
  }

  // 验证数据
  validate(data, schema) {
    const errors = {};
    
    for (const [field, rule] of Object.entries(schema)) {
      const value = data[field];
      const fieldErrors = [];
      
      // 必填验证
      if (rule.required && (value === undefined || value === null || value === '')) {
        fieldErrors.push(`${field}不能为空`);
        continue;
      }
      
      if (value !== undefined && value !== null && value !== '') {
        // 类型验证
        if (rule.type && !this.checkType(value, rule.type)) {
          fieldErrors.push(`${field}类型不正确`);
        }
        
        // 长度验证
        if (rule.minLength && String(value).length < rule.minLength) {
          fieldErrors.push(`${field}长度不能少于${rule.minLength}个字符`);
        }
        
        if (rule.maxLength && String(value).length > rule.maxLength) {
          fieldErrors.push(`${field}长度不能超过${rule.maxLength}个字符`);
        }
        
        // 数值范围验证
        if (rule.min !== undefined && parseFloat(value) < rule.min) {
          fieldErrors.push(`${field}不能小于${rule.min}`);
        }
        
        if (rule.max !== undefined && parseFloat(value) > rule.max) {
          fieldErrors.push(`${field}不能大于${rule.max}`);
        }
        
        // 正则验证
        if (rule.pattern && !rule.pattern.test(String(value))) {
          fieldErrors.push(`${field}格式不正确`);
        }
        
        // 枚举验证
        if (rule.enum && !rule.enum.includes(value)) {
          fieldErrors.push(`${field}必须是${rule.enum.join('、')}中的一个`);
        }
        
        // 自定义验证函数
        if (rule.validator && typeof rule.validator === 'function') {
          const customError = rule.validator(value, data);
          if (customError) {
            fieldErrors.push(customError);
          }
        }
      }
      
      if (fieldErrors.length > 0) {
        errors[field] = fieldErrors;
      }
    }
    
    return {
      isValid: Object.keys(errors).length === 0,
      errors: errors
    };
  }

  // 检查数据类型
  checkType(value, type) {
    switch (type) {
      case 'string':
        return typeof value === 'string';
      case 'number':
        return !isNaN(parseFloat(value));
      case 'boolean':
        return typeof value === 'boolean';
      case 'array':
        return Array.isArray(value);
      case 'object':
        return typeof value === 'object' && value !== null && !Array.isArray(value);
      case 'date':
        return !isNaN(new Date(value).getTime());
      case 'email':
        return constants.REGEX.EMAIL.test(String(value));
      case 'phone':
        return constants.REGEX.PHONE.test(String(value));
      default:
        return true;
    }
  }

  // 验证记账记录
  validateRecord(record) {
    const schema = {
      amount: this.rules.amount,
      category: this.rules.category,
      type: {
        required: true,
        enum: ['expense', 'income']
      },
      note: this.rules.note,
      date: this.rules.date,
      paymentMethod: this.rules.paymentMethod
    };
    
    return this.validate(record, schema);
  }

  // 验证预算设置
  validateBudget(budget) {
    const schema = {
      amount: this.rules.amount,
      month: {
        required: true,
        type: 'number',
        min: 1,
        max: 12
      },
      year: {
        required: true,
        type: 'number',
        min: 2020,
        max: 2030
      }
    };
    
    return this.validate(budget, schema);
  }

  // 验证用户信息
  validateUserInfo(userInfo) {
    const schema = {
      nickName: this.rules.nickname,
      avatarUrl: {
        required: false,
        type: 'string'
      }
    };
    
    return this.validate(userInfo, schema);
  }

  // 清理和格式化数据
  sanitize(data, schema) {
    const sanitized = {};
    
    for (const [field, rule] of Object.entries(schema)) {
      const value = data[field];
      
      if (value !== undefined && value !== null) {
        // 去除前后空格
        if (typeof value === 'string') {
          sanitized[field] = value.trim();
        }
        
        // 转换数值类型
        if (rule.type === 'number' && typeof value === 'string') {
          sanitized[field] = parseFloat(value);
        }
        
        // 转换布尔类型
        if (rule.type === 'boolean' && typeof value === 'string') {
          sanitized[field] = value.toLowerCase() === 'true';
        }
        
        // 转换日期类型
        if (rule.type === 'date' && typeof value === 'string') {
          sanitized[field] = new Date(value);
        }
      }
    }
    
    return sanitized;
  }

  // 获取错误消息
  getErrorMessage(errors) {
    if (Object.keys(errors).length === 0) {
      return '';
    }
    
    const firstError = Object.values(errors)[0][0];
    return firstError || '数据验证失败';
  }

  // 批量验证
  validateBatch(items, schema) {
    const results = [];
    
    for (const item of items) {
      const result = this.validate(item, schema);
      results.push({
        item: item,
        isValid: result.isValid,
        errors: result.errors
      });
    }
    
    return results;
  }
}

module.exports = new DataValidator();