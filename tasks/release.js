var cssmin, fs, globals, grunt, options, path, release, shell, uglify, zip;

path = require('path');

fs = require('fs-extra');

globals = require('./globals');

shell = require('shelljs');

cssmin = require('clean-css');

uglify = require('uglify-js');

zip = require('./zip');

grunt = null;

options = null;

release = {
  src: '',
  dest: '',
  cssMinOpts: {
    advanced: false,
    rebase: false,
    sourceMap: false
  },
  uglifyOpts: {
    banner: '',
    footer: '',
    compress: {
      warnings: false
    },
    mangle: {},
    beautify: false,
    expression: false,
    maxLineLen: 32000,
    ASCIIOnly: false
  },
  getDestinationPath: function(file) {
    var srcPath;
    srcPath = file.replace(this.src, '');
    return path.resolve(path.join(this.dest, srcPath));
  },
  removeMinFiles: function() {
    this.files.filter(function(file) {
      var basename;
      basename = path.basename(file);
      if (basename.indexOf('.min') > -1) {
        return fs.unlink(file);
      }
    });
  },
  setFiles: function() {
    this.files = [];
    if (!grunt.file.exists(this.src)) {
      grunt.log.error("Cannot move files - source doesn't exist.\n(" + this.src + ")");
      return;
    }
    if (grunt.file.isDir(this.src)) {
      return grunt.file.recurse(this.src, (function(_this) {
        return function(abspath) {
          if (abspath.indexOf('.DS_Store') < 0 && abspath.indexOf('.full') < 0) {
            return _this.files.push(abspath);
          }
        };
      })(this));
    } else if (!grunt.file.isDir(this.src)) {
      return this.files = [this.src];
    }
  },
  makeCompressedName: function(file) {
    var basename, extension, newFilename;
    basename = path.basename(file);
    extension = path.extname(file);
    newFilename = basename.replace('.min', '').replace(extension, '.min' + extension);
    return file.replace(basename, newFilename);
  },
  makeCompressedDestName: function(file) {
    var dest;
    dest = this.getDestinationPath(file);
    return this.makeCompressedName(dest);
  },
  isCSSFile: function(file) {
    return path.extname(file) === '.css';
  },
  isJSFile: function(file) {
    return path.extname(file) === '.js';
  },
  isCompressableFile: function(file) {
    return this.isCSSFile(file) || this.isJSFile(file);
  },
  minifyCSS: function(file) {
    var content, minifiedCSS, newFile;
    content = grunt.file.read(file);
    newFile = this.makeCompressedDestName(file);
    minifiedCSS = new cssmin(this.cssMinOpts).minify(content);
    return grunt.file.write(newFile, minifiedCSS.styles);
  },
  minifyJS: function(file) {
    var minifiedS, newFile;
    minifiedS = uglify.minify(file);
    newFile = this.makeCompressedDestName(file);
    return grunt.file.write(newFile, minifiedS.code);
  },
  copyFile: function(file) {
    var destFile;
    destFile = this.getDestinationPath(file);
    return grunt.file.copy(file, destFile);
  },
  compressFiles: function() {
    var file, i, len, ref, results, shouldCompress;
    ref = this.files;
    results = [];
    for (i = 0, len = ref.length; i < len; i++) {
      file = ref[i];
      this.copyFile(file);
      shouldCompress = this.isCompressableFile(file);
      if (!shouldCompress) {
        continue;
      }
      if (this.isCSSFile(file)) {
        results.push(this.minifyCSS(file));
      } else if (this.isJSFile(file)) {
        results.push(this.minifyJS(file));
      } else {
        results.push(void 0);
      }
    }
    return results;
  },
  unlinkDestinationFolder: function() {
    var exists;
    exists = fs.existsSync(this.dest);
    if (exists) {
      return shell.rm('-rf', this.dest);
    }
  },
  getCurrentVersion: function() {
    var info, pkg;
    pkg = path.resolve(path.join(this.base, 'package.json'));
    info = grunt.file.readJSON(pkg);
    return info.version;
  },
  zipFolder: function() {
    var zipDest, zipSource;
    shell.rm('-rf', this.base + "/*.zip");
    zipSource = path.resolve(path.join(this.base, "Clique.UI-" + (this.getCurrentVersion())));
    zipDest = path.resolve(path.join(this.base, "Clique.UI-" + (this.getCurrentVersion()) + ".zip"));
    shell.mv(this.dest, zipSource);
    zip.zip(zipSource, zipDest);
    return shell.rm('-rf', zipSource);
  },
  init: function() {
    grunt = globals.grunt;
    return options = globals.options;
  },
  run: function() {
    this.init();
    this.base = path.resolve(options.release.base);
    this.src = path.resolve(options.release.src);
    this.dest = path.resolve(options.release.dest);
    if (options.debug) {
      console.log('options.release.base ', this.base);
      console.log('options.release.src ', this.src);
      console.log('options.release.dest ', this.dest);
      return;
    }
    this.unlinkDestinationFolder();
    this.setFiles();
    this.removeMinFiles();
    this.compressFiles();
    return this.zipFolder();
  }
};

module.exports = release;
