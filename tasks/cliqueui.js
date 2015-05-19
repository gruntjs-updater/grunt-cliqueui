/*
 * grunt-cliqueui
 * https://github.com/nielse63/grunt-cliqueui
 *
 * Copyright (c) 2015 Erik Nielsen
 * Licensed under the MIT license.
 */

'use strict';

// Load dependent node modules
var phantom = require("./lib/phantom");
var path = require('path');
var async = require('async');
var css = require('css');
var chalk = require('chalk');
var uglify = require('uglify-js');
var beautify = require('js-beautify');
var fs = require('fs');
var cssmin = require('clean-css');

require('shelljs/global');

module.exports = function(grunt) {

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

	var incrementVersion = function(version) {
		var array = version.split('.');
		var major = parseInt(array[0], 10);
		var minor = parseInt(array[1], 10);
		var patch = parseInt(array[2], 10);
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
		return [major, minor, patch].join('.');
	};

	var flatten = function(array) {
		var result = [];
		array.forEach(function(item) {
			Array.prototype.push.apply(
				result, Array.isArray(item) ? flatten(item) : [item]
			);
		});
		return result;
	};

	// Load grunt tasks
	var gitPath = path.resolve(path.join(__dirname, '../', 'node_modules', 'grunt-git'));
	grunt.task.loadNpmTasks('grunt-cliqueui/node_modules/grunt-git');

	// Set grunt config
	grunt.config.set('cliqueui-version', {});
	grunt.config.set('cliqueui-move-files', {});
	grunt.config.set('cliqueui-zip', {});
	grunt.config.set('cliqueui-docs', {});
	grunt.config.set('cleaner_css', {
		custom_task : {
			files : {
			},
		},
	});

	grunt.registerTask('cliqueui-version', 'Increments the project version number', function() {
		grunt.log.ok('Updating project version.');
		if(!grunt.file.exists('package.json')) {
			grunt.log.writeln(chalk.white.bgRed('Could not find package.json file - existing `version`.'));
			return;
		}
		var pkg = grunt.file.readJSON('package.json');
		var currentVersion = pkg.version;
		var newVersion = incrementVersion(currentVersion);
		pkg.version = newVersion;
		grunt.file.write('package.json', JSON.stringify(pkg, null, '\t'));

		// Replace in other files
		var allowedExtensions = ['.php', '.js', '.md', '.html'];
		grunt.file.recurse(process.cwd(), function(abspath, rootdir, subdir, filename) {
			var extension = path.extname(abspath);
			if(abspath.indexOf('node_modules') > -1 || allowedExtensions.indexOf(extension) < 0) {
				return;
			}
			if(extension == '.php' && path.basename(abspath) != 'defs.php') {
				return;
			}
			var content = grunt.file.read(abspath);
			var regex = new RegExp(currentVersion, 'g');
			var matches = content.search(regex);
			if(matches > -1) {
				var newContent = content.replace(regex, newVersion);
				grunt.file.write(abspath, newContent);
				// console.log(matches, abspath);
			}
		});
		grunt.log.ok('Project version updated to v' + newVersion + '.');
	});

	grunt.registerTask('cliqueui-move-files', 'Moves the necessary files to the appropriate folder', function(src, dest) {
		grunt.log.ok('Moving package.json and Gruntfile.js into `.public` folder.');

		// Remove grunt-cliqueui plugin from public package.json
		var pkg = grunt.file.readJSON('package.json');
		delete pkg.devDependencies['grunt-cliqueui'];
		grunt.file.write('.public/package.json', JSON.stringify(pkg, null, '\t'));

		function trimEmptySpace(content) {
			var array = content.split("\n");
			var output = [];
			var lastLine = '';
			var inOpening = false;
			var string = '';
			for(var i = 0; i < array.length; i++) {
				var line = array[i];
				if(i > 0) {
					lastLine = array[i - 1].trim();
				}
				if(line.trim().length == '' && lastLine === '' && i > 0) {
					continue;
				}
				if(line.indexOf('docs') > -1 && line.indexOf('{') > -1) {
					inOpening = true;
					var string = '';
					for(var n = 0; n < line.indexOf('docs'); n++) {
						string += '\t';
					}
					string += '}';
				}
				if(inOpening && line.indexOf(string) == 0) {
					inOpening = false;
					continue;
				}
				if(inOpening) {
					continue;
				}
				output.push(line);
			}
			return output.join('\n');
		}

		var startingString = 'cliqueui: {',
			endingString = '\n\t\t},',
			content = grunt.file.read('Gruntfile.js');

		var startingIndex = content.indexOf(startingString);
		var endingIndex = startingIndex + content.substring(startingIndex).indexOf(endingString) + endingString.length;
		var newContent = content.substring(0, startingIndex) + content.substring(endingIndex);
		newContent = newContent
			.replace(/\/\/ Release/g, '')
			.replace(/grunt.loadNpmTasks('grunt-cliqueui');/g, '');

		startingString = '\tgrunt.registerTask(\n\t\t\'release\',';
		endingString = '\n\t);';
		startingIndex = newContent.indexOf(startingString);
		endingIndex = startingIndex + newContent.substring(startingIndex).indexOf(endingString) + endingString.length;
		newContent = newContent.substring(0, startingIndex) + newContent.substring(endingIndex);
		newContent = trimEmptySpace(newContent);

		grunt.file.write('.public/Gruntfile.js', newContent);

		// Copy fonts
		grunt.file.recurse('docs/fonts', function(abspath) {
			if(abspath.indexOf('icomoon') > -1) {
				grunt.file.copy(abspath, abspath.replace('docs', 'dist'));
			}
		});
	});

	grunt.registerTask('cliqueui-zip', 'Create a zip folder', function() {

		grunt.log.ok('Moving files from build directory to public versioned directory.')
		function makeDestPath(srcpath) {
			srcpath = path.resolve(srcpath);
			var destpath = srcpath
				.replace('cliqueui.dev', 'clique.github/Clique.UI')
				.replace('.public', '');
			destpath = path.resolve(destpath);
			return destpath;
		}

		function cleanDestDir(dir) {
			var destdir = makeDestPath(dir);
			if(destdir.indexOf('/clique.github/Clique.UI/' + path.basename(dir)) < 0) {
				return;
			}
			grunt.file.recurse(destdir, function(abspath) {
				if(grunt.file.isDir(abspath)) {
					return;
				}
				// console.log(abspath);
				grunt.file.delete(abspath, {
					force : true
				});
			});
		}

		function copyDirectory(dir) {
			dir = path.resolve(dir);
			cleanDestDir(dir);
			grunt.file.recurse(dir, function(abspath) {
				if(abspath.indexOf('/results/') > -1 || abspath.indexOf('.DS_Store') > 0) {
					return;
				}
				var srcpath = path.resolve(abspath);
				var destpath = makeDestPath(srcpath);
				// console.log({src : srcpath, dest : destpath});
				grunt.file.copy(srcpath, destpath);
			});
		}

		// Copy files
		var files = ['.csscomb.json', '.editorconfig', 'README.md'];
		grunt.log.ok('Moving files: ' + files.join(', '));
		for(var i = 0; i < files.length; i++) {
			var srcpath = path.resolve(files[i]);
			var destpath = makeDestPath(srcpath);
			// console.log({src : srcpath, dest : destpath});
			grunt.file.copy(srcpath, destpath);
		}

		// Copy directories
		var directories = ['.public', 'build', 'unittests'];
		grunt.log.ok('Moving directories: ' + directories.join(', '));
		for(var i = 0; i < directories.length; i++) {
			var srcpath = path.resolve(directories[i]);
			copyDirectory(srcpath);
		}

		// Remove old zip
		var publishedDir = makeDestPath(process.cwd());
		grunt.log.ok('Removing old zip file.');
		grunt.file.recurse(publishedDir, function(abspath) {
			if(abspath.indexOf('node_modules') > -1 || path.extname(abspath) != '.zip') {
				return;
			}
			// console.log(abspath);
			grunt.file.delete(abspath, {
				force : true
			});
		});

		// Make the new zip
		var pkg = grunt.file.readJSON('package.json'),
			version = pkg.version,
			name = 'Clique.UI-' + version + '.zip',
			infolder = path.resolve('dist') + '/',
			outfolder = path.resolve(name.replace('.zip', '')) + '/',
			zip = which('zip'),
			cmd = zip + " -rq " + name + " " + name.replace('.zip', '');
		grunt.log.ok('Creating new zip file: ' + name);

		// Remove existing folder
		if(grunt.file.exists(path.resolve(name))) {
			grunt.file.delete(path.resolve(name));
		}
		if(grunt.file.exists(path.resolve(name.replace('.zip', '')))) {
			grunt.file.delete(path.resolve(name.replace('.zip', '')));
		}

		// Copy `dist` folder into new version nameed folder
		cp('-R', infolder, outfolder);

		// Create the zip file
		cd(path.resolve());
		exec(cmd, [false, false]);

		// Copy the zip
		grunt.file.copy(path.resolve(name), makeDestPath(name));

		// Clean up the current directory
		grunt.log.ok('Cleaning the development project folder.');
		if(grunt.file.exists(path.resolve(name))) {
			grunt.file.delete(path.resolve(name));
		}
		if(grunt.file.exists(path.resolve(name.replace('.zip', '')))) {
			grunt.file.delete(path.resolve(name.replace('.zip', '')));
		}
	});

	grunt.registerTask('cliqueui-docs', 'Create a zip folder', function() {

		grunt.log.ok('Updating public docs directory')
		function makeDestPath(srcpath) {
			srcpath = path.resolve(srcpath);
			var destpath = srcpath
				.replace('cliqueui.dev', 'clique.github/Clique.UI-Docs')
				.replace('.docs', '');
			destpath = path.resolve(destpath);
			return destpath;
		}

		function cleanDestDir(dir) {
			var destdir = makeDestPath(dir);
			if(destdir.indexOf('/clique.github/Clique.UI-Docs/' + path.basename(dir)) < 0) {
				return;
			}
			grunt.file.recurse(destdir, function(abspath) {
				if(grunt.file.isDir(abspath)) {
					return;
				}
				// console.log({ clean : abspath });
				grunt.file.delete(abspath, {
					force : true
				});
			});
		}

		function copyDirectory(dir) {
			dir = path.resolve(dir);
			cleanDestDir(dir);
			grunt.file.recurse(dir, function(abspath) {
				if(abspath.indexOf('/results/') > -1 || abspath.indexOf('.DS_Store') > 0) {
					return;
				}
				var srcpath = path.resolve(abspath);
				var destpath = makeDestPath(srcpath);
				// console.log({src : srcpath, dest : destpath});
				grunt.file.copy(srcpath, destpath);
			});
		}

		// Copy files
		var files = ['.csscomb.json', '.editorconfig', '.gitignore', '.htaccess', 'index.php', 'LICENSE'];
		grunt.log.ok('Moving files: ' + files.join(', '));
		for(var i = 0; i < files.length; i++) {
			var srcpath = path.resolve(files[i]);
			var destpath = makeDestPath(srcpath);
			// console.log({src : srcpath, dest : destpath});
			grunt.file.copy(srcpath, destpath);
		}

		// Copy directories
		var directories = ['.docs', 'docs', 'php'];
		grunt.log.ok('Moving directories: ' + directories.join(', '));
		for(var i = 0; i < directories.length; i++) {
			var srcpath = path.resolve(directories[i]);
			copyDirectory(srcpath);
		}

	});

	grunt.registerMultiTask('cliqueui', 'A simple build simple for the Clique.UI framework', function() {
		var options = this.options({
			// commands : ['removeSelectors', 'version', 'move', 'release']
			debug : false,
			commands : ['version', 'move', 'zip'],
			version : {
				base : ''
			},
			move : {
				base : '',
				src : '',
				dest : ''
			},
			release : {
				base : '',
				src : '',
				dest : ''
			}
		});
		var takslist = ['gitadd', 'gitcommit'];

		function shouldRunCommand(cmd) {
			return options.commands.indexOf(cmd) > -1;
		}

		// Increment the version string
		takslist = [];
		if(shouldRunCommand('version') && grunt.task.exists('cliqueui-version')) {
			takslist.push('cliqueui-version:' + options.version.base);
		}

		// Move files
		if(shouldRunCommand('move') && grunt.task.exists('cliqueui-move-files')) {
			takslist.push('cliqueui-move-files:' + options.move.src + ':' + options.move.dest);
		}

		// Clean, compile and zip
		if(shouldRunCommand('zip') && grunt.task.exists('cliqueui-zip')) {
			takslist.push('cliqueui-zip');
		}

		// Update docs repo
		if(shouldRunCommand('docs') && grunt.task.exists('cliqueui-docs')) {
			takslist.push('cliqueui-docs');
		}

		grunt.config.set('gitadd', {
			task: {
				options : {
					cwd : path.resolve(process.cwd()),
					all : true
				},
			},
		});
		grunt.config.set('gitcommit', {
			task : {
				options : {
					cwd : path.resolve(process.cwd()),
					message : 'Automated commit prior to creating release',
					allowEmpty : true,
					noStatus : true
				},
			},
		});

		takslist = flatten(takslist);
		grunt.log.ok('Executing tasks: ' + takslist.join(' '));
		grunt.task.run(takslist);
	});
};
