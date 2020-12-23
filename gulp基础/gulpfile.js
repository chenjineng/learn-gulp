const { src, dest, series, parallel } = require('gulp');
const concat = require('gulp-concat');        // 合并文件
const uglify = require('gulp-uglify');        // js 压缩
const csso = require('gulp-csso');            // css压缩
const imagemin = require('gulp-imagemin');    // 图片压缩
const clean = require('gulp-clean');          // 清空文件夹

/* 清空dist文件夹 */
function handleClean() {
  return src(['./dist/*'])
    .pipe(clean());
}

/* .html文件不处理，直接输出 */
function handleHTML() {
  return src('./src/*.html')
    .pipe(dest('dist/'))
}

/* .js文件合并压缩，库文件不做处理 */
function handleLibsJS() {
  return src('./src/libs/js/*.js')
    .pipe(dest('dist/js'))
}

function minJS() {
  return src('./src/js/*.js')
    .pipe(concat('main.min.js')) // 合并文件并命名
    .pipe(uglify()) // 压缩js
    .pipe(dest('dist/js'))
}

/* .css文件合并压缩 */
function minCSS() {
  return src('./src/css/*.css')
    .pipe(concat('main.min.css'))
    .pipe(csso()) // 压缩优化css
    .pipe(dest('dist/css'))
}

/* 图片压缩 */
function minImages() {
  return src('./src/images/*.*')
    .pipe(imagemin({
      progressive: true,
    }))
    .pipe(dest('./dist/images'));
}

/* 控制台输入gulp执行default任务 */
exports.default = series( // 同步执行
  handleClean, // 先清空dist文件夹
  
  parallel( // 并行执行
    handleHTML,
    handleLibsJS,
    minJS,
    minCSS,
    minImages
  )
)