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
var path = require("path");
var async = require("async");
var css = require('css');

// Internal tasks
var globals = require('./globals');
var removeSelectors = require('./remove-selectors');
var version = require('./version');
var move = require('./move');
var release = require('./release');

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

	grunt.registerMultiTask('cliqueui', 'A simple build simple for the Clique.UI framework', function() {

		var options = this.options({
			// base : 'http://cliqueui.dev/',
			// usingSitemap : true,
			// reportsDirectory : path.resolve(path.join(path.dirname(__dirname), 'tmp')),
			// cleanCSS : true,
			// cssFiles : [],
			// cssOutput : false,
			// commands : ['removeSelectors', 'version', 'move', 'release']
			debug : false,
			commands : ['version', 'move', 'release'],
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

		function shouldRunCommand(cmd) {
			return options.commands.indexOf(cmd) > -1;
		}

		globals.options = options;
		globals.grunt = grunt;
		globals.files = this.files;
		globals.base = path.resolve();

		// Remove selectors
		if(shouldRunCommand('removeSelectors')) {
			removeSelectors.run();
		}

		// Move files
		if(shouldRunCommand('move')) {
			move.run();
		}

		// Increment the version string
		if(shouldRunCommand('version')) {
			version.run();
		}

		// Clean, compile and zip
		if(shouldRunCommand('release')) {
			release.run();
		}

	});
};
