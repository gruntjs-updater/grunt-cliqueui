var async, css, fs, grunt, path, phantom, removeSelectors;

phantom = require("./lib/phantom");

path = require("path");

async = require("async");

css = require('css');

fs = require('fs');

grunt = null;

removeSelectors = {
  options: {},
  urls: [],
  destination: null,
  tmpdir: path.resolve(path.join(path.dirname(__dirname), 'tmp')),
  cleanTmpFolder: function() {
    var tmpdir;
    tmpdir = this.tmpdir;
    if (grunt.file.exists(tmpdir)) {
      grunt.file["delete"](tmpdir);
    }
    if (!grunt.file.exists(tmpdir)) {
      return grunt.file.mkdir(tmpdir);
    }
  },
  printMessage: function(str) {
    grunt.log.writeln("\n" + str);
    return grunt.log.writeln('=============');
  },
  setDestination: function() {
    var file, i, len, ref, results, typeOf;
    typeOf = grunt.util.kindOf;
    if (typeOf(this.files) === 'array') {
      ref = this.files;
      results = [];
      for (i = 0, len = ref.length; i < len; i++) {
        file = ref[i];
        if (typeOf(file) === 'object' && file.orig) {
          this.destination = path.normalize(file.orig.dest);
          results.push(this.urls = file.orig.src);
        } else {
          results.push(void 0);
        }
      }
      return results;
    } else {
      return console.log(["`this.files` isn't an array", this.files]);
    }
  },
  getSitemapFromURL: function(url) {
    var isComplete, options;
    options = this.options;
    isComplete = false;
    phantom.get('getSitemap', url, function(content) {
      var urlsToCheck;
      grunt.log.ok('Completed reading sitemap');
      urlsToCheck = content.split(' ');
      return console.log(urlsToCheck);
    });
    return this.interval = setInterval((function(_this) {
      return function() {
        if (isComplete) {
          clearInterval(_this.interval);
          return console.log('Phantom is complete');
        }
      };
    })(this), 1000);
  },
  getStylesFromSitemap: function() {
    var url;
    url = this.urls[0];
    this.printMessage('Retreiving sitemap at ' + url);
    return this.getSitemapFromURL(url);
  },
  run: function() {
    grunt = this.grunt;
    this.cleanTmpFolder();
    this.setDestination();
    if (this.options.usingSitemap) {
      this.getStylesFromSitemap();
    }
    return this.printMessage('Complete');
  }
};

module.exports = removeSelectors;
