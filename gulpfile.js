exports.default = () => require('gulp').src('Money.js')
  .pipe(require('gulp-uglify')())
  .pipe(require('gulp-rename')(`money.min.v${require('./package.json').version}.js`))
  .pipe(require('gulp').dest('dist/'));