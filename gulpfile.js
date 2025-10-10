const gulp = require('gulp');
const clean = require('gulp-clean');
const rename = require('gulp-rename');

// 清理构建目录
gulp.task('clean', function() {
  return gulp.src('dist', { read: false, allowEmpty: true })
    .pipe(clean());
});

// 编译任务 - 复制文件到dist目录
gulp.task('compile', function() {
  return gulp.src([
    '**/*',
    '!node_modules/**',
    '!dist/**',
    '!gulpfile.js',
    '!package.json',
    '!package-lock.json',
    '!.eslintrc.js',
    '!.gitignore'
  ], { base: '.' })
    .pipe(gulp.dest('dist'));
});

// 预览任务 - 启动微信开发者工具预览
gulp.task('preview', function(done) {
  console.log('编译完成，请在微信开发者工具中预览项目');
  done();
});

// 默认任务
gulp.task('default', gulp.series('clean', 'compile', 'preview'));

// 开发模式任务
gulp.task('dev', gulp.series('clean', 'compile', 'preview'));

// 生产构建任务
gulp.task('build', gulp.series('clean', 'compile'));