var fs, globals, grunt, moveFiles, options, path;

path = require('path');

fs = require('fs-extra');

globals = require('./globals');

grunt = null;

options = null;

moveFiles = {
  src: '',
  dest: '',
  normalizePaths: function(src) {
    var newDest, newSrc, srcPath;
    srcPath = src.replace(this.base, '');
    newSrc = path.resolve(path.join(this.base, srcPath));
    newDest = path.resolve(path.join(this.baseDest, srcPath));
    return {
      src: newSrc,
      dest: newDest
    };
  },
  setFileArray: function(files, key, dir) {
    var destFile, file, i, j, len, len1, results, srcFile, toExclude;
    if (dir == null) {
      dir = '';
    }
    toExclude = [];
    this.files[key] = [];
    for (i = 0, len = files.length; i < len; i++) {
      file = files[i];
      if (file.indexOf('!') > -1) {
        toExclude.push(file.replace('!', ''));
      }
    }
    results = [];
    for (j = 0, len1 = files.length; j < len1; j++) {
      file = files[j];
      if (file.indexOf('!') > -1) {
        continue;
      }
      srcFile = path.resolve(path.join(this.src, file));
      destFile = path.resolve(path.join(this.dest, file));
      if (!grunt.file.exists(srcFile)) {
        continue;
      }
      if (grunt.file.isDir(srcFile)) {
        results.push(grunt.file.recurse(srcFile, (function(_this) {
          return function(abspath) {
            var exclude, k, len2, obj, results1;
            if (toExclude.length) {
              results1 = [];
              for (k = 0, len2 = toExclude.length; k < len2; k++) {
                exclude = toExclude[k];
                if (!(abspath.indexOf(exclude) > -1)) {
                  obj = _this.normalizePaths(abspath);
                  results1.push(_this.files[key].push({
                    src: obj.src,
                    dest: obj.dest
                  }));
                } else {
                  results1.push(void 0);
                }
              }
              return results1;
            }
          };
        })(this)));
      } else {
        results.push(this.files[key].push({
          src: srcFile,
          dest: destFile
        }));
      }
    }
    return results;
  },
  moveFiles: function() {
    var file, files, key, ref, results;
    ref = this.files;
    results = [];
    for (key in ref) {
      files = ref[key];
      results.push((function() {
        var i, len, results1;
        results1 = [];
        for (i = 0, len = files.length; i < len; i++) {
          file = files[i];
          if (grunt.file.isDir(file.src)) {
            results1.push(this.moveFilesForFolder(file.src, file.dest));
          } else {
            results1.push(this.moveFile(file.src, file.dest));
          }
        }
        return results1;
      }).call(this));
    }
    return results;
  },
  moveFilesForFolder: function(src, dest) {
    return grunt.file.recurse(src, (function(_this) {
      return function(abspath) {
        var obj;
        obj = _this.normalizePaths(abspath);
        return _this.moveFile(obj.src, obj.dest);
      };
    })(this));
  },
  moveFile: function(src, dest) {
    if (src.indexOf('.DS_Store') > -1) {
      return;
    }
    return grunt.file.copy(src, dest);
  },
  baseFiles: function() {
    var files;
    files = ['.csscomb.json', '.editorconfig', 'Gruntfile.js', 'LICENSE', 'package.json', 'README.md'];
    return this.setFileArray(files, 'base');
  },
  privateFiles: function() {
    var files;
    files = ['.notes', 'scripts'];
    return this.setFileArray(files, 'private');
  },
  publicFiles: function() {
    var files;
    files = ['build', 'dist', 'unittests', '!results'];
    return this.setFileArray(files, 'public');
  },
  movePublicGruntfile: function() {
    var dest, file, src;
    file = this.normalizePaths('.public/Gruntfile.js');
    src = file.src;
    dest = path.resolve(file.dest.replace('.public', ''));
    return this.moveFile(src, dest);
  },
  init: function() {
    grunt = globals.grunt;
    options = globals.options;
    return this.files = {};
  },
  run: function() {
    this.init();
    this.base = this.src = path.resolve(options.move.src);
    this.baseDest = this.dest = path.resolve(options.move.dest);
    if (options.debug) {
      console.log('options.move.base ', this.base);
      console.log('options.move.src ', this.src);
      console.log('options.move.dest ', this.dest);
      return;
    }
    this.baseFiles();
    this.privateFiles();
    this.publicFiles();
    this.moveFiles();
    return this.movePublicGruntfile();
  }
};

module.exports = moveFiles;
