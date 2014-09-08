Doppelganger.RouteManager = RouteManager = function(app, rootUrl) {
	this.app = app;
	this.router = new Sherpa.Router(),
	this.baseUrl = rootUrl;
	this.routes = [];
};
Doppelganger.RouteManager.prototype = {
	add: function(routeArray){
		var length = routeArray.length,
			i = 0,
			routeObject, name, url;
		
		for (; i < length; i++) {
			routeObject = routeArray[i];
			name = routeObject.name;
			url = routeObject.url;
			//have to use .to and .name because Sherpa is annoying like that
			//consider switching to a different router at some point
			this.router.add(this.baseUrl + url, routeObject).to(name).name(name);
		}
		this.routes = this.routes.concat(routeArray);
	},
	recognize: function (fullUrl) {
		var queryIndex = fullUrl.indexOf('?'),
		urlWithoutQuery = fullUrl,
		queryParams, routeObject;
		if (queryIndex !== -1) {
			urlWithoutQuery = fullUrl.substring(0, queryIndex);
			queryParams = Arg.parse(fullUrl);
		}
		routeObject = this.router.recognize(urlWithoutQuery);
		//If the route was found, clean it up and add query params to the params list.
		if (routeObject) {
			routeObject = du.extend({}, routeObject);
			routeObject.params = du.extend(routeObject.params, queryParams);
		}
		return routeObject;
	},
	generate: function (name, params) {
		//because Sherpa mutates params we hand it a copy instead.
		return this.router.generate(name, du.extend({}, params));
	},
	trigger: function(destination, routeData) {
		return Doppelganger.getRouteHandler(destination).call(this.app, routeData);
	}
};