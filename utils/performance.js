// 性能监控工具
class PerformanceMonitor {
  constructor() {
    this.startTime = Date.now();
    this.pageLoadTimes = {};
    this.apiResponseTimes = {};
  }

  // 记录页面加载时间
  recordPageLoad(pageName) {
    const loadTime = Date.now() - this.startTime;
    this.pageLoadTimes[pageName] = loadTime;
    
    // 上报性能数据（生产环境）
    if (this.isProduction()) {
      this.reportPerformance('page_load', {
        page: pageName,
        loadTime: loadTime
      });
    }
    
    console.log(`页面 ${pageName} 加载耗时: ${loadTime}ms`);
  }

  // 记录API响应时间
  recordApiResponse(apiName, startTime) {
    const responseTime = Date.now() - startTime;
    this.apiResponseTimes[apiName] = responseTime;
    
    // 上报性能数据（生产环境）
    if (this.isProduction()) {
      this.reportPerformance('api_response', {
        api: apiName,
        responseTime: responseTime
      });
    }
    
    console.log(`API ${apiName} 响应耗时: ${responseTime}ms`);
  }

  // 检查是否为生产环境
  isProduction() {
    return wx.getAccountInfoSync().miniProgram.envVersion === 'release';
  }

  // 上报性能数据
  reportPerformance(type, data) {
    // 在实际项目中，这里可以调用性能监控服务
    console.log('性能数据上报:', type, data);
  }

  // 获取性能报告
  getPerformanceReport() {
    return {
      totalUptime: Date.now() - this.startTime,
      pageLoadTimes: this.pageLoadTimes,
      apiResponseTimes: this.apiResponseTimes,
      averagePageLoadTime: this.calculateAverage(this.pageLoadTimes),
      averageApiResponseTime: this.calculateAverage(this.apiResponseTimes)
    };
  }

  // 计算平均值
  calculateAverage(times) {
    const values = Object.values(times);
    if (values.length === 0) return 0;
    return values.reduce((sum, time) => sum + time, 0) / values.length;
  }

  // 内存使用监控
  monitorMemoryUsage() {
    if (wx.getPerformance) {
      const performance = wx.getPerformance();
      const memory = performance.memory;
      
      if (memory) {
        console.log('内存使用情况:', {
          used: memory.usedJSHeapSize,
          total: memory.totalJSHeapSize,
          limit: memory.jsHeapSizeLimit
        });
        
        // 内存警告
        if (memory.usedJSHeapSize > memory.jsHeapSizeLimit * 0.8) {
          console.warn('内存使用率过高，建议优化');
        }
      }
    }
  }

  // 网络状态监控
  monitorNetworkStatus() {
    wx.onNetworkStatusChange((res) => {
      console.log('网络状态变化:', {
        isConnected: res.isConnected,
        networkType: res.networkType
      });
      
      if (!res.isConnected) {
        console.warn('网络连接已断开');
      }
    });
  }
}

module.exports = new PerformanceMonitor();