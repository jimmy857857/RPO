// WXSS语法验证测试脚本
const fs = require('fs');
const path = require('path');

console.log('=== WXSS语法验证测试 ===\n');

const wxssPath = 'miniprogram/pages/accounting/statistics.wxss';
if (fs.existsSync(wxssPath)) {
  const content = fs.readFileSync(wxssPath, 'utf8');
  
  console.log('🔍 检查不兼容的CSS语法:');
  
  // 检查不支持的CSS函数和单位
  const unsupportedPatterns = [
    { pattern: /calc\(/, name: 'calc()函数' },
    { pattern: /vw/, name: 'vw单位' },
    { pattern: /vh/, name: 'vh单位' },
    { pattern: /rem/, name: 'rem单位' },
    { pattern: /em/, name: 'em单位' },
    { pattern: /var\(/, name: 'CSS变量' }
  ];
  
  let hasErrors = false;
  unsupportedPatterns.forEach(pattern => {
    const matches = content.match(pattern.pattern);
    if (matches) {
      console.log(`❌ 发现不支持的语法: ${pattern.name}`);
      console.log(`   位置: ${matches.length}处`);
      hasErrors = true;
    } else {
      console.log(`✅ ${pattern.name}: 无问题`);
    }
  });
  
  // 检查WXSS支持的语法
  console.log('\n✅ 检查WXSS支持的语法:');
  const supportedPatterns = [
    { pattern: /rpx/, name: 'rpx单位' },
    { pattern: /@media/, name: '媒体查询' },
    { pattern: /\.\w+\s*\{/, name: '类选择器' },
    { pattern: /#\w+\s*\{/, name: 'ID选择器' }
  ];
  
  supportedPatterns.forEach(pattern => {
    const matches = content.match(pattern.pattern);
    if (matches) {
      console.log(`✅ ${pattern.name}: 支持`);
    } else {
      console.log(`ℹ️ ${pattern.name}: 未使用`);
    }
  });
  
  if (!hasErrors) {
    console.log('\n🎉 WXSS文件语法验证通过！');
    console.log('📋 所有CSS语法都兼容微信小程序WXSS规范');
  } else {
    console.log('\n⚠️ 发现不兼容的语法，需要修复');
  }
} else {
  console.log('❌ 文件不存在:', wxssPath);
}

console.log('\n=== 测试完成 ===');