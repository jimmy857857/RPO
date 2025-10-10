// 更新管理工具
const errorHandler = require('./errorHandler.js');
const storageManager = require('./storageManager.js');

class UpdateManager {
  constructor() {
    this.updateManager = null;
    this.hasNewVersion = false;
  }

  // 初始化更新检查
  init() {
    if (wx.getUpdateManager) {
      this.updateManager = wx.getUpdateManager();
      
      // 监听检查更新结果
      this.updateManager.onCheckForUpdate((res) => {
        console.log('检查更新结果:', res.hasUpdate);
        this.hasNewVersion = res.hasUpdate;
      });

      // 监听更新下载完成
      this.updateManager.onUpdateReady(() => {
        this.showUpdateConfirm();
      });

      // 监听更新失败
      this.updateManager.onUpdateFailed(() => {
        errorHandler.showError('新版本下载失败，请检查网络后重试');
      });
    }
  }

  // 显示更新确认对话框
  showUpdateConfirm() {
    wx.showModal({
      title: '更新提示',
      content: '新版本已经准备好，是否重启应用？',
      success: (res) => {
        if (res.confirm) {
          // 应用更新
          this.updateManager.applyUpdate();
        }
      }
    });
  }

  // 手动检查更新
  checkUpdate() {
    return new Promise((resolve, reject) => {
      if (!this.updateManager) {
        reject(new Error('更新管理器未初始化'));
        return;
      }

      this.updateManager.onCheckForUpdate((res) => {
        resolve(res.hasUpdate);
      });

      // 触发检查更新
      this.updateManager.applyUpdate();
    });
  }

  // 获取版本信息
  getVersionInfo() {
    try {
      // 安全地获取版本信息
      let version = '1.0.0';
      let env = 'release';
      
      // 检查方法是否存在
      if (wx.getAccountInfoSync) {
        const accountInfo = wx.getAccountInfoSync();
        if (accountInfo && accountInfo.miniProgram) {
          version = accountInfo.miniProgram.version || version;
          env = accountInfo.miniProgram.envVersion || env;
        }
      }
      
      return {
        version: version,
        environment: env,
        lastCheckTime: storageManager.get('lastUpdateCheck') || '从未检查',
        hasNewVersion: this.hasNewVersion
      };
    } catch (error) {
      // 如果获取失败，返回默认值
      return {
        version: '1.0.0',
        environment: 'release',
        lastCheckTime: storageManager.get('lastUpdateCheck') || '从未检查',
        hasNewVersion: this.hasNewVersion
      };
    }
  }

  // 记录更新检查时间
  recordCheckTime() {
    storageManager.set('lastUpdateCheck', new Date().toISOString());
  }

  // 显示版本信息
  showVersionInfo() {
    const versionInfo = this.getVersionInfo();
    
    wx.showModal({
      title: '版本信息',
      content: `当前版本: ${versionInfo.version}
环境: ${versionInfo.environment}
最后检查: ${versionInfo.lastCheckTime}
${versionInfo.hasNewVersion ? '有新版本可用' : '已是最新版本'}`,
      showCancel: false
    });
  }

  // 强制更新检查（用于设置页面）
  forceCheckUpdate() {
    wx.showLoading({
      title: '检查更新中...'
    });

    this.checkUpdate().then((hasUpdate) => {
      wx.hideLoading();
      
      if (hasUpdate) {
        this.showUpdateConfirm();
      } else {
        wx.showToast({
          title: '已是最新版本',
          icon: 'success'
        });
      }
      
      this.recordCheckTime();
    }).catch((error) => {
      wx.hideLoading();
      errorHandler.handleError(error, '检查更新失败');
    });
  }
}

module.exports = new UpdateManager();