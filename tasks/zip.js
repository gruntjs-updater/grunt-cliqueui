var path;

require('shelljs/global');

path = require('path');

module.exports = {
  src: '',
  dest: '',
  test: function() {
    this.bin = which('zip');
    if (!this.bin) {
      throw new Error('`zip` command not found. Exiting.');
    }
  },
  zip: function(src, dest) {
    var basename, cmd, dirname;
    if (src == null) {
      src = this.src;
    }
    if (dest == null) {
      dest = this.dest;
    }
    this.test();
    dirname = path.dirname(src);
    basename = path.basename(src);
    cmd = this.bin + " -rq " + dest + " " + basename;
    cd(dirname);
    return exec(cmd, [false, false]);
  }
};
