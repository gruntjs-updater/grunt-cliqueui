/*
 * grunt-cliqueui
 * https://github.com/nielse63/grunt-cliqueui
 *
 * Copyright (c) 2015 Erik Nielsen
 * Licensed under the MIT license.
 */

'use strict';

module.exports = function(grunt) {

	grunt.initConfig({
		jshint: {
			all: [
			'Gruntfile.js',
			'tasks/*.js',
			'<%= nodeunit.tests %>'
			],
			options: {
				jshintrc: '.jshintrc'
			}
		},

		clean: {
			tests: ['tmp']
		},
		coffee: {
			options: {
				join: false,
				bare: true
			},
			tasks: {
				files: [{
					expand: true,
					cwd: 'coffee',
					src: ['**/*.coffee'],
					dest: '',
					ext: '.js',
					extDot : 'last'
				}]
			},
		},
		watch: {
			coffee: {
				files: [ 'Gruntfile.js', 'coffee/**/*.coffee' ],
				tasks: [ 'coffee' ]
			},
		},

		cliqueui: {
			default_options: {
				options: {
					// commands : ['version', 'move', 'release'],
					commands : ['move'],
					version : {
						base : ''
					},
					move : {
						base : 'tmp',
						src : 'tmp',
						dest : 'tmp/.public',
						tasksToRemove : ['cliqueui', 'pagespeed', 'release']
					},
					release : {
						base : '../clique.github/Clique.UI',
						src : 'dist',
						dest : '../clique.github/Clique.UI/dist'
					}
				},
				files: {
					'tmp': ['http://cliqueui.dev/sitemap']
				}
			}
		},

		nodeunit: {
			tests: ['test/*_test.js']
		}
	});

  // Actually load this plugin's task(s).
  grunt.loadTasks('tasks');

  // These plugins provide necessary tasks.
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-coffee');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-nodeunit');

  // Whenever the "test" task is run, first clean the "tmp" dir, then run this
  // plugin's task(s), then test the result.
  grunt.registerTask('test', ['clean', 'cliqueui', 'nodeunit']);
  grunt.registerTask('create', ['coffee', 'cliqueui'])

  // By default, lint and run all tests.
  grunt.registerTask('default', ['jshint', 'test']);

};
