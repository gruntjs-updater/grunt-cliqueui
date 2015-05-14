var globals, grunt, options, path, version;

path = require('path');

globals = require('./globals');

grunt = null;

options = null;

version = {
  src: '',
  dest: '',
  getCurrentVersion: function() {
    var pkg;
    pkg = path.resolve(path.join(this.base, 'package.json'));
    this.info = grunt.file.readJSON(pkg);
    return this.info.version;
  },
  incrementVersion: function(version) {
    var array, major, minor, patch;
    if (version == null) {
      version = this.getCurrentVersion();
    }
    this.oldVersion = version;
    array = version.split('.');
    major = parseInt(array[0], 10);
    minor = parseInt(array[1], 10);
    patch = parseInt(array[2], 10);
    if (patch === 9) {
      minor++;
      patch = 0;
      if (minor > 8) {
        major++;
        minor = 0;
      }
    } else {
      patch++;
    }
    return this.newVersion = [major, minor, patch].join('.');
  },
  replaceVersionString: function() {
    var extensions;
    extensions = ['.php', '.coffee', '.js', '.md', '.json', '.html'];
    return grunt.file.recurse(this.base, (function(_this) {
      return function(abspath) {
        var basename, content, extension, hasString, newContent;
        extension = path.extname(abspath);
        if (abspath.indexOf('node_modules') > -1 || extensions.indexOf(extension) < 0) {
          return;
        }
        basename = path.basename(abspath);
        if (basename === 'package.json') {
          content = grunt.file.read(abspath);
          hasString = content.indexOf('"version": "' + _this.oldVersion + '",');
          if (hasString > -1) {
            newContent = content.replace(_this.oldVersion, _this.newVersion);
            return grunt.file.write(abspath, newContent);
          }
        } else {
          content = grunt.file.read(abspath);
          hasString = content.indexOf(_this.oldVersion);
          if (hasString > -1) {
            newContent = content.replace(_this.oldVersion, _this.newVersion);
            return grunt.file.write(abspath, newContent);
          }
        }
      };
    })(this));
  },
  init: function() {
    grunt = globals.grunt;
    return options = globals.options;
  },
  run: function() {
    this.init();
    this.base = path.resolve(options.version.base);
    if (options.debug) {
      console.log('options.version.base ', this.base);
      return;
    }
    this.incrementVersion();
    return this.replaceVersionString();
  }
};

module.exports = version;
