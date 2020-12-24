const { src, dest, series, parallel, watch } = require('gulp');
const csso = require('gulp-csso');                 // 压缩Css
const autoPrefixer = require('gulp-autoprefixer'); // 添加css前缀
const sass = require('gulp-sass');                 // Sass转Css
const uglify = require('gulp-uglify');             // 压缩JS
const babel = require('gulp-babel');               // 转码ES6
const htmlmin = require('gulp-htmlmin');           // 压缩HTML
const imagemin = require('gulp-imagemin');         // 压缩图片
const webserver = require('gulp-webserver');       // 搭建本地服务器
const concat = require('gulp-concat');             // 合并文件
const clean = require('gulp-clean');               // 清空文件夹
const fileInclude = require('gulp-file-include');  // HTML组件引入
const fs = require('fs');                          // fs模块
const gulpif = require('gulp-if');                 // 条件判断
const rev = require('gulp-rev-dxb');	             // 生成版本号清单  
const revCollector = require('gulp-rev-collector-dxb'); // 替换成版本号文件
var env = 'dev';                                   // 环境变量

/* 清空dist文件夹 */
function cleanHandler() {
  return src(['./dist/*'])
    .pipe(clean());
}

/* 压缩.html，引入组件 */
function htmlHandler() {
  const htmlMinConfig = {
    collapseBooleanAttributes: true, // checked="checked" -> checked
    collapseWhitespace: true,        // 移除空格
    removeEmptyAttributes: true,     // 移除空的属性 -> checked=""
    removeAttributeQuotes: true,     // 移除属性上的双引号
    minifyCSS: true,                 // 压缩内嵌式css代码，只能基本压缩
    minifyJS: true,                  // 压缩内嵌式js代码，只能基本压缩，不能转码
  }
  return src('./src/*.html')
    .pipe(fileInclude({
      prefix: '@',                   // 自定义的标识符
      basepath: './src/components',  // 组件文件所在的文件夹路径 
    }))
    .pipe(htmlmin(htmlMinConfig))
    .pipe(dest('dist/'))
}

/* 合并压缩.js，库文件不做处理 */
function jsHandler() {
  const babelConfig = {
    presets: ['@babel/env']                // 如果是babel@7设置为：presets: ['es2015'] 
  }
  return src('./src/js/*.js')
    .pipe(babel(babelConfig))
    .pipe(concat('main.min.js'))            // 合并文件并命名
    .pipe(gulpif(env === 'prod', uglify())) // 生产环境下才压缩
    .pipe(dest('dist/js'))
}

function jsLibHandler() {
  return src('./src/libs/js/*.js')
    .pipe(dest('dist/js'))
}

/* .scss文件合并压缩 */
function sassHandler() {
  return src('./src/css/*.scss')
    .pipe(concat('main.min.css'))
    .pipe(sass())
    .pipe(autoPrefixer())                  // package.json配置browserslist
    .pipe(gulpif(env === 'prod', csso()))  // 生产环境下才压缩
    .pipe(dest('dist/css'))
}

function cssHandler() {
  return src('./src/css/*.css')
    .pipe(dest('dist/css'))
}

/* 图片压缩 */
function imgHandler() {
  return src('./src/images/*.*')
    .pipe(imagemin({
      progressive: true,
    }))
    .pipe(dest('./dist/images'));
}

/* 启动服务器 */
function webHandler() {
  return src('./dist')
    .pipe(webserver({
      host: 'localhost',
      port: '8080',
      livereload: true,    // 当文件修改时，自动刷信页面
      open: '/index.html', // 默认打开哪一个文件，dist文件夹下 
      proxies: [           // 配置代理接口，解决本地请求跨域问题 
        {
          source: '/api',          // 代理标识符
          target: 'www.baidu.com'  // 代理目标地址
        }
      ]
    }))
}

/* 监听文件修改、删除、新增 */
function watchHandler() {
  watch('src/*.html', htmlHandler);
  watch('src/css/*.css', cssHandler);
  watch('src/js/*.js', jsHandler);
  watch('src/images/**', imgHandler);
}

/* 设置环境变量 */
function setEnvDev(cb) {
  env = 'dev';
  cb();
}

/* 设置环境变量 */
function setEnvProd(cb) {
  env = 'prod';
  cb();
}

/* 生成带版本号的JS、Css文件 */
function revHandler() {
  const list = [
    './dist/js/**', 
    './dist/css/**',
    './dist/images/**'
  ]
  return src(list)
    .pipe(rev())            // 为文件添加版本号
    .pipe(rev.manifest())   // 生成版本号文件清单 rev-manifest.json
    .pipe(dest("./"))
}

/* html添加带版本号的JS、Css文件 */
function htmlReplacePath() {
  return src(['./rev-manifest.json', './dist/*.html'])
    .pipe(revCollector())   // 根据 rev-manifest.json，替换html中的JS、Css文件引用
    .pipe(dest('./dist'));
}

/* 开发环境构建，不需要压缩操作。命令行输入gulp dev或npm run dev，后者需要配置package.json的scripts */
exports.dev = series( // 同步执行
  setEnvDev,
  cleanHandler,
  parallel(           // 并行执行
    htmlHandler,
    jsLibHandler,
    jsHandler,
    cssHandler,
    sassHandler,
    imgHandler
  ),
  webHandler,
  watchHandler
)

/* 生产环境构建。不需要启动服务器、监听。命令行输入gulp build或npm run build */
exports.build = series(
  setEnvProd,
  cleanHandler,
  parallel(
    htmlHandler,
    jsLibHandler,
    jsHandler,
    cssHandler,
    sassHandler,
    imgHandler
  ),
  revHandler,
  htmlReplacePath
)
