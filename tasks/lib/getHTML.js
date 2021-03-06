/*global phantom:true*/
/*global require:true*/
/*global window:true*/

/*
phantom args
  [0] - url
*/
(function(){
	"use strict";
	var system = require("system");
	var page = require("webpage").create();
	var site = phantom.args[0],
		output = phantom.args[1];
	page.open(site, function(status) {
		if(status !== "success") {
			phantom.exit(1);
		}
		console.log(page.content);
		phantom.exit(0);
	});
}());
