// pages/profile/settings.js
const { errorHandler, storageManager, updateManager } = require('../../utils/index.js');

Page({
  data: {
    userInfo: {},
    openid: '',
    registerTime: '',
    settings: {
      theme: 'light',
      notification: true,
      autoBackup: true,
      dataRetention: '30',
      language: 'zh-CN'
    },
    versionInfo: {}
  },

  onLoad() {
    this.loadUserInfo();
    this.loadSettings();
    this.loadVersionInfo();
  },

  // 加载用户信息
  loadUserInfo() {
    const userInfo = wx.getStorageSync('userInfo') || {};
    const openid = wx.getStorageSync('token') || '未登录';
    const registerTime = wx.getStorageSync('registerTime') || new Date().toLocaleDateString();
    
    this.setData({
      userInfo: userInfo,
      openid: openid,
      registerTime: registerTime
    });
  },

  // 加载设置
  loadSettings() {
    const savedSettings = storageManager.getSettings();
    this.setData({
      settings: { ...this.data.settings, ...savedSettings }
    });
  },

  // 加载版本信息
  loadVersionInfo() {
    const versionInfo = updateManager.getVersionInfo();
    this.setData({ versionInfo });
  },

  // 主题切换
  onThemeChange(e) {
    const theme = e.detail.value;
    this.updateSetting('theme', theme);
    this.applyTheme(theme);
  },

  // 通知开关
  onNotificationChange(e) {
    this.updateSetting('notification', e.detail.value);
  },

  // 自动备份开关
  onAutoBackupChange(e) {
    this.updateSetting('autoBackup', e.detail.value);
  },

  // 数据保留时间
  onDataRetentionChange(e) {
    this.updateSetting('dataRetention', e.detail.value);
  },

  // 语言设置
  onLanguageChange(e) {
    this.updateSetting('language', e.detail.value);
  },

  // 更新设置
  updateSetting(key, value) {
    const settings = { ...this.data.settings, [key]: value };
    this.setData({ settings });
    storageManager.setSettings(settings);
  },

  // 应用主题
  applyTheme(theme) {
    // 在实际项目中，这里可以实现主题切换逻辑
    console.log('切换主题:', theme);
  },

  // 检查更新
  onCheckUpdate() {
    updateManager.forceCheckUpdate();
  },

  // 查看版本信息
  onViewVersionInfo() {
    updateManager.showVersionInfo();
  },

  // 清理缓存
  onClearCache() {
    wx.showModal({
      title: '清理缓存',
      content: '确定要清理所有缓存数据吗？此操作不可逆。',
      success: (res) => {
        if (res.confirm) {
          this.clearCacheData();
        }
      }
    });
  },

  // 清理缓存数据
  clearCacheData() {
    wx.showLoading({ title: '清理中...' });
    
    setTimeout(() => {
      const clearedCount = storageManager.cleanupExpiredCache();
      wx.hideLoading();
      
      wx.showToast({
        title: `已清理${clearedCount}个缓存`,
        icon: 'success'
      });
    }, 1000);
  },

  // 导出数据
  onExportData() {
    if (!this.data.settings.autoBackup) {
      errorHandler.showError('请先开启自动备份功能');
      return;
    }

    wx.showLoading({ title: '导出中...' });
    
    // 模拟数据导出
    setTimeout(() => {
      wx.hideLoading();
      wx.showModal({
        title: '导出成功',
        content: '数据已导出到本地文件',
        showCancel: false
      });
    }, 2000);
  },

  // 恢复数据
  onRestoreData() {
    wx.showModal({
      title: '恢复数据',
      content: '请选择备份文件进行恢复',
      success: (res) => {
        if (res.confirm) {
          this.restoreData();
        }
      }
    });
  },

  // 恢复数据
  restoreData() {
    wx.showLoading({ title: '恢复中...' });
    
    // 模拟数据恢复
    setTimeout(() => {
      wx.hideLoading();
      wx.showModal({
        title: '恢复成功',
        content: '数据已从备份文件恢复',
        showCancel: false
      });
    }, 2000);
  },

  // 重置设置
  onResetSettings() {
    wx.showModal({
      title: '重置设置',
      content: '确定要恢复默认设置吗？',
      success: (res) => {
        if (res.confirm) {
          this.resetToDefault();
        }
      }
    });
  },

  // 重置为默认设置
  resetToDefault() {
    const defaultSettings = {
      theme: 'light',
      notification: true,
      autoBackup: true,
      dataRetention: '30',
      language: 'zh-CN'
    };
    
    this.setData({ settings: defaultSettings });
    storageManager.setSettings(defaultSettings);
    
    wx.showToast({
      title: '已恢复默认设置',
      icon: 'success'
    });
  },

  // 查看存储信息
  onViewStorageInfo() {
    const storageInfo = storageManager.getInfo();
    
    if (storageInfo) {
      wx.showModal({
        title: '存储信息',
        content: `已使用: ${storageInfo.currentSize}KB
总容量: ${storageInfo.limitSize}KB
使用率: ${storageInfo.usageRate}
存储键: ${storageInfo.keys.length}个`,
        showCancel: false
      });
    }
  },

  // 切换用户
  onSwitchUser() {
    wx.showModal({
      title: '切换用户',
      content: '确定要切换用户吗？当前用户的数据将会被清除。',
      success: (res) => {
        if (res.confirm) {
          this.switchUser();
        }
      }
    });
  },

  // 执行用户切换
  switchUser() {
    wx.showLoading({ title: '切换中...' });
    
    // 清除当前用户数据
    storageManager.clearUserData();
    storageManager.clear();
    
    // 清除登录状态
    wx.removeStorageSync('token');
    wx.removeStorageSync('userInfo');
    
    setTimeout(() => {
      wx.hideLoading();
      
      // 显示切换成功提示
      wx.showToast({
        title: '用户切换成功',
        icon: 'success',
        duration: 2000
      });
      
      // 延迟跳转到登录页面或重新加载
      setTimeout(() => {
        // 重新启动小程序
        wx.reLaunch({
          url: '/pages/index/index'
        });
      }, 1500);
      
    }, 1000);
  },

  // 页面分享
  onShareAppMessage() {
    return {
      title: '设置 - 记账游戏助手',
      path: '/pages/profile/settings'
    };
  }
});