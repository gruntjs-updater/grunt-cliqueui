/*
 * grunt-cliqueui
 * https://github.com/nielse63/grunt-cliqueui
 *
 * Copyright (c) 2015 Erik Nielsen
 * Licensed under the MIT license.
 */

'use strict';

module.exports = function(grunt) {

	var phantom = require("./lib/phantom");
	var path = require("path");
	var async = require("async");
	var uncss = require('uncss');
	var css = require('css');

	var printObject = function(obj) {
			var k, v;
			for(k in obj) {
				v = obj[k];
				if(grunt.util.kindOf(v) == 'object' || grunt.util.kindOf(v) == 'array') {
					printObject(v);
				} else {
					grunt.log.writeln(k + ': ' + v);
				}
			}
		};

	grunt.registerMultiTask('cliqueui', 'A simple build simple for the Clique.UI framework', function() {
		var options = this.options({
				base : 'http://cliqueui.dev/',
				usingSitemap : true,
				reportsDirectory : path.resolve(path.join(path.dirname(__dirname), 'tmp')),
				cleanCSS : true,
				cssFiles : [],
				// cssOutput : path.resolve(path.join(path.dirname(__dirname), 'tmp', 'to-remove.json')),
				cssOutput : false
			}),
			urls = [],
			done = this.async(),
			destination,
			count = {
				total : 0,
				complete : 0
			},
			cssContent = '',
			cssArray = [],
			tmpdir = path.resolve(path.join(path.dirname(__dirname), 'tmp')),
			rawCSSPath = path.resolve(path.join(options.reportsDirectory, 'uncss-raw.css')),
			cssReport = path.resolve(path.join(path.dirname(__dirname), 'css-selectors-to-remove.txt')),
			cleanTmpFolder = function() {
				if(grunt.file.exists(tmpdir)) {
					grunt.file.delete(tmpdir);
				}
				if(!grunt.file.exists(tmpdir)) {
					grunt.file.mkdir(tmpdir);
				}
			},
			titleFromURL = function(url) {
				var path = url.replace(options.base, '');
				return path + '.html'
			},
			getHTML = function(url) {
				grunt.log.ok('Getting HTML for ' + url);
				phantom.get('getHTML', url, function(content) {
					var basename = titleFromURL(url);
					var file = path.resolve(path.join(path.dirname(__dirname), 'tmp', basename));
					grunt.file.write(file, content);
					setTimeout(function() {
						count.complete++;
						if(!grunt.file.exists(tmpdir)) {
							grunt.log.error('Could not save temporary file to ' + file);
							return;
						}
						grunt.log.ok(basename + ' temp file saved successfully.' + "\n");
					}, 0);
				});
			},
			isString = function(obj) {
				return Object.prototype.toString.call(obj) === '[object String]';
			},
			getCSSFiles = function() {
				cssContent = '';
				async.eachSeries(options.cssFiles, function(obj, callback) {
					cssContent += grunt.file.read(obj);
					callback.apply();
				}, function(error) {
					if(error) {
						grunt.log.error(error);
						return;
					}
					grunt.file.write(rawCSSPath, cssContent);
				});
			},
			cleanupCSS = function(file, callback) {
				file = grunt.util.kindOf(file) != 'string' ? file[0] : file;
				grunt.log.ok('Getting HTML for ' + file);

				var report = path.resolve(path.join(options.reportsDirectory, 'selectors-to-remove.txt'));
				var content = grunt.file.read(report);
				cssArray = content.split(',');
				if(!cssArray.length) {
					callback.apply();
					return;
				}

				phantom.getForCSS(file, cssArray, function(content) {
					var foundSelectors = content.split(',');
					var newoutput = [];
					for(var i = 0; i < cssArray.length; i++) {
						var selector = cssArray[i];
						if(foundSelectors.indexOf(selector) > -1) {
							// ...
						} else {
							newoutput.push(selector);
						}
					}
					grunt.file.write(report, newoutput.join(','));

					setTimeout(function() {
						callback.apply();
					}, 0);
				});
			},
			fileRenderComplete = function() {
				grunt.log.writeln('=============');
				grunt.log.writeln('All files rendered');

				cleanupCSS();
			},
			listenForComplete = function() {
				var interval = setInterval(function() {
					if(count.complete >= count.total) {
						clearInterval(interval);

						fileRenderComplete();
						// done();
					}
				}, 100);
			};

		cleanTmpFolder();

		if(grunt.util.kindOf(this.files) == 'array') {
			for(var i = 0; i < this.files.length; i++) {
				var file = this.files[i];
				var k, v;
				for(k in file) {
					v = file[k];
					if(k == 'orig') {
						urls = v.src;
						destination = file.dest;
					}
				}
			}
		} else {
			// ...
		}

		if(options.usingSitemap) {
			var url = urls[0];
			grunt.log.writeln("\n" + 'Retreiving sitemap at ' + url);
			grunt.log.writeln('=============');
			phantom.get('getSitemap', url, function(content) {
				grunt.log.ok('Completed reading sitemap');
				var urlsToCheck = content.split(' ');

				// Clean out docs CSS
				if(options.cleanCSS && options.cssFiles.length) {
					grunt.log.writeln("\n" + 'Cleaning CSS');
					grunt.log.writeln('=============');

					getCSSFiles();

					var ats = css.parse(cssContent, { source: rawCSSPath });
					var cssArray = [];
					var k, v;
					for(var i = 0; i < ats.stylesheet.rules.length; i++) {
						var rule = ats.stylesheet.rules[i];
						if(rule.type == 'rule') {
							for(var j = 0; j < rule.selectors.length; j++) {
								cssArray.push(rule.selectors[j]);
							}
						}
					}
					var report = path.resolve(path.join(options.reportsDirectory, 'selectors-to-remove.txt'));
					grunt.file.write(report, cssArray);

					setTimeout(function() {
						async.eachSeries(urlsToCheck, cleanupCSS, function(error) {
							if(error) {
								grunt.log.error(error);
								return;
							}
							cssArray = grunt.file.read(report).split(',');
							if(cssArray.length) {
								var length = cssArray.length;
								var term = length > 1 ? 'were' : 'was';
								var s = length > 1 ? 's' : '';
								if(options.cssOutput && grunt.util.kindOf(options.cssOutput) == 'string') {
									grunt.log.warn('There ' + term + ' ' + length + ' unsused CSS rule set' + s + ' found.');
									grunt.file.write(options.cssOutput, JSON.stringify(cssArray, null, 2));
								} else {
									grunt.log.warn('There ' + term + ' ' + length + ' unsused CSS rule set' + s + ' found:');
									console.log(JSON.stringify(cssArray, null, 2));
								}
							}
							done();
						});
					}, 0);
				}
			});
		} else {
			for(var i = 0; i < urls.length; i++) {
				var url = urls[i];
				// ...
			}
		}
	});

};
