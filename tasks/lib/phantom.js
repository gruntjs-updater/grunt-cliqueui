/*global console:true*/
/*global require:true*/
/*global __dirname:true*/
(function(exports) {
	"use strict";
	var path = require( "path" );
	var execFile = require("child_process").execFile;
	var phantomPath = require( "phantomjs" ).path;
	exports.get = function(command, url, cb) {
		if(!(typeof url === "string" && typeof command === "string")) {
			throw new Error( "URL and command must be strings" );
		}
		if(!(url.length && command.length)) {
			throw new Error( "URL and command must not be empty strings" );
		}
		var phantomscript = path.resolve(path.join( __dirname, command + ".js"));
		execFile(phantomPath, [ phantomscript, url ], function(err, stdout, stderr) {
			var stringOutput;
			if(err) {
				throw err;
			}
			if(stderr) {
				console.error(stderr);
			}
			if(stdout) {
				stringOutput = stdout;
			}
			if(cb) {
				cb(stringOutput);
			}
		});
	};
	exports.getForCSS = function(url, array, cb) {
		if(!(typeof url === "string")) {
			throw new Error( "URL must be strings" );
		}
		if(!(url.length)) {
			throw new Error( "URL must not be empty strings" );
		}
		var phantomscript = path.resolve(path.join( __dirname, "getStyleSheets.js"));
		execFile(phantomPath, [ phantomscript, url, array ], function(err, stdout, stderr) {
			var stringOutput;
			if(err) {
				throw err;
			}
			if(stderr) {
				console.error(stderr);
			}
			if(stdout) {
				stringOutput = stdout;
			}
			if(cb) {
				cb(stringOutput);
			}
		});
	};
}(typeof exports === "object" && exports || this));
