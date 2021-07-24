const path = require('path');
const fs = require('fs');
const package = require('./package.json');
const mainName = `money.min.v${package.version}.js`;
package.main = `${mainName}`;
package.dependencies = undefined;
package.scripts = undefined;
fs.writeFileSync(path.join(__dirname, 'package.json'), JSON.stringify(package, undefined, 2), { 'flag': 'w' });
try {
  const files = fs.readdirSync(path.join(__dirname, 'dist'));
  for (const file of files) {
    fs.unlinkSync(path.join(path.join(__dirname, 'dist'), file));
  }
  fs.rmdirSync(path.join(__dirname, 'dist'));
} catch(err) {}


exports.default = () => require('gulp').src('Money.js')
  .pipe(require('gulp-uglify')())
  .pipe(require('gulp-rename')(mainName))
  .pipe(require('gulp').dest('./'));