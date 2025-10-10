const fs = require('fs');
const path = require('path');

console.log('=== 详细WXSS语法检查 ===\n');

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

// 检查不支持的语法
const unsupportedPatterns = [
    { pattern: /\b\d*\.?\d+vh\b/, name: 'vh单位' },
    { pattern: /\b\d*\.?\d+em\b/, name: 'em单位' },
    { pattern: /\bcalc\(/, name: 'calc()函数' },
    { pattern: /\bvar\(/, name: 'CSS变量' },
    { pattern: /\b\d*\.?\d+rem\b/, name: 'rem单位' },
    { pattern: /\b\d*\.?\d+vw\b/, name: 'vw单位' },
    { pattern: /\*\s*\{/, name: '通用选择器*' },
    { pattern: /@import/, name: '@import规则' },
    { pattern: /!important/, name: '!important声明' }
];

let hasErrors = false;

wxssFiles.forEach(filePath => {
    console.log(`🔍 检查文件: ${path.relative(__dirname, filePath)}`);
    
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    
    let fileHasErrors = false;
    
    lines.forEach((line, index) => {
        unsupportedPatterns.forEach(patternInfo => {
            if (patternInfo.pattern.test(line)) {
                console.log(`   ❌ 第${index + 1}行: ${patternInfo.name}`);
                console.log(`      内容: ${line.trim()}`);
                fileHasErrors = true;
                hasErrors = true;
            }
        });
    });
    
    if (!fileHasErrors) {
        console.log('   ✅ 无问题');
    }
    console.log('');
});

if (hasErrors) {
    console.log('⚠️ 发现不兼容的语法，需要修复');
} else {
    console.log('🎉 所有WXSS文件语法检查通过');
}

console.log('=== 检查完成 ===');