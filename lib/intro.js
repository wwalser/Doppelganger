(function(root){
	'use strict';
	//main Doppelganger constructor.
	var Doppelganger;

	//Doppelganger objects
	var Filter, FilterManager, Route, RouteManager;

	//Doppelganger utils and selector
	var du, $;

	//useful prototypes.
	var arrayProto = Array.prototype;

	//useful functions.
	var slice = arrayProto.slice;

	//natives
	var nativeIsArray = arrayProto.isArray;
	var nativeForEach = arrayProto.forEach;
	var nativeIndexOf = arrayProto.indexOf;
	var document = root.document || {};

	//Supplied by dependencies
	var Sherpa = root.Sherpa || {Router: function(){}};
	var Arg = root.Arg || {all: function(){}};