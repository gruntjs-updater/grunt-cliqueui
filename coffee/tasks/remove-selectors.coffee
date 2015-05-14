
phantom = require("./lib/phantom")
path = require("path")
async = require("async")
css = require('css')
fs = require('fs')

grunt = null

removeSelectors =
	# Inherited from Grunt
	options : {}

	# Placeholder properties
	urls : [],
	destination : null,

	# done : this.async(),
	# cssContent : '',
	# cssArray : [],

	# Objects
	# count : {
	# 	total : 0,
	# 	complete : 0
	# },

	# Paths
	tmpdir : path.resolve(path.join(path.dirname(__dirname), 'tmp')),
	# rawCSSPath : path.resolve(path.join(options.reportsDirectory, 'uncss-raw.css')),
	# cssReport : path.resolve(path.join(path.dirname(__dirname), 'css-selectors-to-remove.txt')),

	# Functions
	cleanTmpFolder : ->
		tmpdir = @tmpdir
		if grunt.file.exists(tmpdir)
			grunt.file.delete(tmpdir);
		unless grunt.file.exists(tmpdir)
			grunt.file.mkdir(tmpdir);
	# titleFromURL : function(url) {
	# 	var path = url.replace(options.base, '');
	# 	return path + '.html'
	# },
	# getHTML : function(url) {
	# 	grunt.log.ok('Getting HTML for ' + url);
	# 	phantom.get('getHTML', url, function(content) {
	# 		var basename = titleFromURL(url);
	# 		var file = path.resolve(path.join(path.dirname(__dirname), 'tmp', basename));
	# 		grunt.file.write(file, content);
	# 		setTimeout(function() {
	# 			count.complete++;
	# 			if(!grunt.file.exists(tmpdir)) {
	# 				grunt.log.error('Could not save temporary file to ' + file);
	# 				return;
	# 			}
	# 			grunt.log.ok(basename + ' temp file saved successfully.' + "\n");
	# 		}, 0);
	# 	});
	# },
	# isString : function(obj) {
	# 	return Object.prototype.toString.call(obj) === '[object String]';
	# },
	# getCSSFiles : function() {
	# 	cssContent = '';
	# 	async.eachSeries(options.cssFiles, function(obj, callback) {
	# 		cssContent += grunt.file.read(obj);
	# 		callback.apply();
	# 	}, function(error) {
	# 		if(error) {
	# 			grunt.log.error(error);
	# 			return;
	# 		}
	# 		grunt.file.write(rawCSSPath, cssContent);
	# 	});
	# },
	# cleanupCSS : function(file, callback) {
	# 	file = grunt.util.kindOf(file) != 'string' ? file[0] : file;
	# 	grunt.log.ok('Getting HTML for ' + file);

	# 	var report = path.resolve(path.join(options.reportsDirectory, 'selectors-to-remove.txt'));
	# 	var content = grunt.file.read(report);
	# 	cssArray = content.split(',');
	# 	if(!cssArray.length) {
	# 		callback.apply();
	# 		return;
	# 	}

	# 	phantom.getForCSS(file, cssArray, function(content) {
	# 		var foundSelectors = content.split(',');
	# 		var newoutput = [];
	# 		for(var i = 0; i < cssArray.length; i++) {
	# 			var selector = cssArray[i];
	# 			if(foundSelectors.indexOf(selector) > -1) {
	# 						# ...
	# 					} else {
	# 						newoutput.push(selector);
	# 					}
	# 				}
	# 				grunt.file.write(report, newoutput.join(','));

	# 				setTimeout(function() {
	# 					callback.apply();
	# 				}, 0);
	# 			});
	# },
	# fileRenderComplete : function() {
	# 	grunt.log.writeln('=============');
	# 	grunt.log.writeln('All files rendered');
	# 	cleanupCSS();
	# },
	# listenForComplete : function() {
	# 	var interval = setInterval(function() {
	# 		if(count.complete >= count.total) {
	# 			clearInterval(interval);
	# 			fileRenderComplete();
	# 		}
	# 	}, 100);
	# },
	printMessage : (str)->
		grunt.log.writeln("\n" + str);
		grunt.log.writeln('=============');

	setDestination : ->
		typeOf = grunt.util.kindOf;
		if typeOf(@files) is'array'
			for file in @files
				if typeOf(file) is 'object' and file.orig
					@destination = path.normalize file.orig.dest
					@urls = file.orig.src
					# console.log(this.urls);
					# console.log(this.destination);
		else
			console.log ["`this.files` isn't an array", this.files]

	getSitemapFromURL : (url)->
		options = @options

		isComplete = false
		phantom.get 'getSitemap', url, (content)->
			grunt.log.ok 'Completed reading sitemap'
			urlsToCheck = content.split ' '
			console.log(urlsToCheck);

			# Clean out docs CSS
			# if(options.cleanCSS && options.cssFiles.length) {

			# 	# Update the user
			# 	$this.printMessage('Cleaning CSS');

			# 	$this.getCSSFiles();

			# 	var ats = css.parse(cssContent, { source: rawCSSPath });
			# 	var cssArray = [];
			# 	var k, v;
			# 	for(var i = 0; i < ats.stylesheet.rules.length; i++) {
			# 		var rule = ats.stylesheet.rules[i];
			# 		if(rule.type == 'rule') {
			# 			for(var j = 0; j < rule.selectors.length; j++) {
			# 				cssArray.push(rule.selectors[j]);
			# 			}
			# 		}
			# 	}
			# 	var report = path.resolve(path.join(options.reportsDirectory, 'selectors-to-remove.txt'));
			# 	grunt.file.write(report, cssArray);

			# 	setTimeout(function() {
			# 		async.eachSeries(urlsToCheck, cleanupCSS, function(error) {
			# 			if(error) {
			# 				grunt.log.error(error);
			# 				return;
			# 			}
			# 			cssArray = grunt.file.read(report).split(',');
			# 			if(cssArray.length) {
			# 				var length = cssArray.length;
			# 				var term = length > 1 ? 'were' : 'was';
			# 				var s = length > 1 ? 's' : '';
			# 				if(options.cssOutput && grunt.util.kindOf(options.cssOutput) == 'string') {
			# 					grunt.log.warn('There ' + term + ' ' + length + ' unsused CSS rule set' + s + ' found.');
			# 					grunt.file.write(options.cssOutput, JSON.stringify(cssArray, null, 2));
			# 				} else {
			# 					grunt.log.warn('There ' + term + ' ' + length + ' unsused CSS rule set' + s + ' found:');
			# 					console.log(JSON.stringify(cssArray, null, 2));
			# 				}
			# 			}
			# 			done();
			# 		});
			# 	}, 0);
			# }

		@interval = setInterval =>
			if isComplete
				clearInterval @interval
				console.log 'Phantom is complete'
		, 1000

	getStylesFromSitemap : ->
		url = this.urls[0];

		# Update the user
		@printMessage('Retreiving sitemap at ' + url);

		# Get the sitemap
		@getSitemapFromURL(url);

	run : ->
		# Set globals
		grunt = @grunt;

		# Clean the `tmp` folder
		@cleanTmpFolder();

		# Set the `dest` property
		@setDestination();

		if @options.usingSitemap
			@getStylesFromSitemap()

		@printMessage('Complete')


module.exports = removeSelectors
