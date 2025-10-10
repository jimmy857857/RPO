// 工具类统一导出
const errorHandler = require('./errorHandler.js');
const performanceMonitor = require('./performance.js');
const securityUtils = require('./security.js');
const dataValidator = require('./dataValidator.js');
const storageManager = require('./storageManager.js');
const updateManager = require('./updateManager.js');
const constants = require('./constants.js');

// 统一导出所有工具类
module.exports = {
  errorHandler,
  performanceMonitor,
  securityUtils,
  dataValidator,
  storageManager,
  updateManager,
  constants
};