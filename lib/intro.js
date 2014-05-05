(function(root){
	'use strict';
	//main Doppelganger constructor.
	var Doppelganger;
	Doppelganger = function(){
		this.routes = {};
		this.filters = {};
	};
	if ( typeof module === "object" && typeof module.exports === "object" ) {
		module.exports = Doppelganger;
	} else {
		root['Doppelganger'] = Doppelganger;
	}

	//Doppelganger objects
	var FilterManager, RouteManager;

	var document = root.document || {};
