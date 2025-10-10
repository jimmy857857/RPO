const fs = require('fs');
const path = require('path');

console.log('=== 最终WXSS语法兼容性测试 ===\n');

// 检查的文件类型
const wxssFiles = [];
const pagesDir = path.join(__dirname, 'miniprogram/pages');

function findWxssFiles(dir) {
    const files = fs.readdirSync(dir);
    files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat.isDirectory()) {
            findWxssFiles(filePath);
        } else if (file.endsWith('.wxss')) {
            wxssFiles.push(filePath);
        }
    });
}

findWxssFiles(pagesDir);

console.log(`📁 检查 ${wxssFiles.length} 个WXSS文件\n`);

// 检查不支持的语法
const unsupportedPatterns = [
    { pattern: /\b\d*\.?\d+vh\b/g, name: 'vh单位' },
    { pattern: /\b\d*\.?\d+em\b/g, name: 'em单位' },
    { pattern: /\bcalc\(/g, name: 'calc()函数' },
    { pattern: /\bvar\(/g, name: 'CSS变量' },
    { pattern: /\b\d*\.?\d+rem\b/g, name: 'rem单位' },
    { pattern: /\b\d*\.?\d+vw\b/g, name: 'vw单位' },
    { pattern: /\*\s*\{/g, name: '通用选择器*' },
    { pattern: /@import/g, name: '@import规则' },
    { pattern: /!important/g, name: '!important声明' }
];

let totalErrors = 0;
let filesWithErrors = 0;

wxssFiles.forEach(filePath => {
    const relativePath = path.relative(__dirname, filePath);
    const content = fs.readFileSync(filePath, 'utf8');
    
    let fileErrors = [];
    
    unsupportedPatterns.forEach(patternInfo => {
        const matches = content.match(patternInfo.pattern);
        if (matches) {
            fileErrors.push({
                pattern: patternInfo.name,
                count: matches.length,
                examples: matches.slice(0, 3)
            });
        }
    });
    
    if (fileErrors.length > 0) {
        filesWithErrors++;
        console.log(`❌ ${relativePath}`);
        fileErrors.forEach(error => {
            console.log(`   ${error.pattern}: ${error.count}处`);
            if (error.examples.length > 0) {
                console.log(`     示例: ${error.examples.join(', ')}`);
            }
        });
        console.log('');
        totalErrors += fileErrors.reduce((sum, err) => sum + err.count, 0);
    } else {
        console.log(`✅ ${relativePath}`);
    }
});

console.log('=== 测试结果汇总 ===');
console.log(`📊 检查文件数: ${wxssFiles.length}`);
console.log(`❌ 有问题的文件: ${filesWithErrors}`);
console.log(`⚠️ 总错误数: ${totalErrors}`);

if (totalErrors === 0) {
    console.log('\n🎉 恭喜！所有WXSS文件语法完全兼容微信小程序规范！');
} else {
    console.log('\n🔧 需要修复不兼容的语法');
}

console.log('\n=== 测试完成 ===');