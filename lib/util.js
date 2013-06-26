Doppelganger.util = du = {
	capitolize: function(str){
		return str.charAt(0).toUpperCase() + str.slice(1);
	},
	extend: function(obj){
		var iterable = slice.call(arguments, 1),
			source, i, prop;
		for (i = 0; i < iterable.length; i++) {
			source = iterable[i];
			if (source) {
				for (prop in source) {
					obj[prop] = source[prop];
				}
			}
		}
		return obj;
	},
	each: function(){
		//_.each
	},
	map: function(){
		//_.map
	},
	$: function(){
		//selector engine
	},
};
$ = du.$;
