/*global phantom:true*/
/*global require:true*/
/*global window:true*/

/*
phantom args
  [0] - url
  [1] - selectors (array)
*/
(function(){
	"use strict";
	var system = require("system");
	var page = require("webpage").create();
	var async = require('async');
	var site = phantom.args[0];
	var selectors = phantom.args[1];
	selectors = selectors.split(',');
	page.open(site, function(status) {
		if(status !== "success") {
			phantom.exit(1);
		}

		var array = this.evaluate(function(selectors) {
			var output = [];
			for(var i = 0; i < selectors.length; i++) {
				var selector = selectors[i];
				var ele = document.querySelector(selector);
				if(ele) {
					output.push(selector);
				}
			}
			return {
				selectors : output
			};
		}, selectors);

		console.log(array.selectors);
		phantom.exit(0);
	});
}());
