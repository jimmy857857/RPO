// 存储管理工具
const securityUtils = require('./security.js');
const errorHandler = require('./errorHandler.js');

class StorageManager {
  constructor() {
    this.prefix = 'rpo_'; // 存储键名前缀
    this.encryptedFields = ['token', 'userInfo', 'openid'];
  }

  // 设置存储数据
  set(key, value, encrypt = false) {
    try {
      const storageKey = this.prefix + key;
      let storageValue = value;
      
      // 敏感数据加密
      if (encrypt || this.encryptedFields.includes(key)) {
        storageValue = securityUtils.encrypt(value);
      }
      
      wx.setStorageSync(storageKey, storageValue);
      return true;
    } catch (error) {
      errorHandler.handleError(error, `存储数据失败: ${key}`);
      return false;
    }
  }

  // 获取存储数据
  get(key, decrypt = false) {
    try {
      const storageKey = this.prefix + key;
      let value = wx.getStorageSync(storageKey);
      
      if (value && (decrypt || this.encryptedFields.includes(key))) {
        value = securityUtils.decrypt(value);
      }
      
      return value;
    } catch (error) {
      errorHandler.handleError(error, `获取存储数据失败: ${key}`);
      return null;
    }
  }

  // 删除存储数据
  remove(key) {
    try {
      const storageKey = this.prefix + key;
      wx.removeStorageSync(storageKey);
      return true;
    } catch (error) {
      errorHandler.handleError(error, `删除存储数据失败: ${key}`);
      return false;
    }
  }

  // 清除所有存储数据
  clear() {
    try {
      const storageInfo = wx.getStorageInfoSync();
      const keys = storageInfo.keys.filter(key => key.startsWith(this.prefix));
      
      keys.forEach(key => {
        wx.removeStorageSync(key);
      });
      
      return true;
    } catch (error) {
      errorHandler.handleError(error, '清除存储数据失败');
      return false;
    }
  }

  // 获取存储信息
  getInfo() {
    try {
      const storageInfo = wx.getStorageInfoSync();
      const filteredKeys = storageInfo.keys.filter(key => key.startsWith(this.prefix));
      
      return {
        keys: filteredKeys,
        currentSize: storageInfo.currentSize,
        limitSize: storageInfo.limitSize,
        usageRate: (storageInfo.currentSize / storageInfo.limitSize * 100).toFixed(2) + '%'
      };
    } catch (error) {
      errorHandler.handleError(error, '获取存储信息失败');
      return null;
    }
  }

  // 设置用户信息
  setUserInfo(userInfo) {
    return this.set('userInfo', userInfo, true);
  }

  // 获取用户信息
  getUserInfo() {
    return this.get('userInfo', true);
  }

  // 设置登录令牌
  setToken(token) {
    return this.set('token', token, true);
  }

  // 获取登录令牌
  getToken() {
    return this.get('token', true);
  }

  // 清除用户数据
  clearUserData() {
    this.remove('userInfo');
    this.remove('token');
    this.remove('openid');
    return true;
  }

  // 设置应用设置
  setSettings(settings) {
    return this.set('settings', settings);
  }

  // 获取应用设置
  getSettings() {
    return this.get('settings') || {};
  }

  // 设置缓存数据（带过期时间）
  setCache(key, value, expireTime = 3600000) { // 默认1小时
    const cacheData = {
      value: value,
      expireTime: Date.now() + expireTime
    };
    
    return this.set(`cache_${key}`, cacheData);
  }

  // 获取缓存数据
  getCache(key) {
    const cacheData = this.get(`cache_${key}`);
    
    if (cacheData && cacheData.expireTime > Date.now()) {
      return cacheData.value;
    }
    
    // 缓存过期，删除数据
    this.remove(`cache_${key}`);
    return null;
  }

  // 批量设置数据
  setBatch(dataMap) {
    const results = {};
    
    for (const [key, value] of Object.entries(dataMap)) {
      results[key] = this.set(key, value);
    }
    
    return results;
  }

  // 批量获取数据
  getBatch(keys) {
    const results = {};
    
    for (const key of keys) {
      results[key] = this.get(key);
    }
    
    return results;
  }

  // 检查存储空间
  checkStorageSpace() {
    const info = this.getInfo();
    if (!info) return false;
    
    const usageRate = info.currentSize / info.limitSize;
    
    if (usageRate > 0.8) {
      console.warn('存储空间使用率超过80%，建议清理缓存');
      return false;
    }
    
    return true;
  }

  // 清理过期缓存
  cleanupExpiredCache() {
    try {
      const storageInfo = wx.getStorageInfoSync();
      const cacheKeys = storageInfo.keys.filter(key => 
        key.startsWith(this.prefix) && key.startsWith('cache_')
      );
      
      let cleanedCount = 0;
      
      for (const key of cacheKeys) {
        const cacheData = wx.getStorageSync(key);
        if (cacheData && cacheData.expireTime < Date.now()) {
          wx.removeStorageSync(key);
          cleanedCount++;
        }
      }
      
      console.log(`清理了${cleanedCount}个过期缓存`);
      return cleanedCount;
    } catch (error) {
      errorHandler.handleError(error, '清理过期缓存失败');
      return 0;
    }
  }
}

module.exports = new StorageManager();