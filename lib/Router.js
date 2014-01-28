Doppelganger.Router = Router = function(rootUrl, options) {
	this.router = new Sherpa.Router(),
	this.baseUrl = rootUrl;
	this.options = du.extend({}, options);
	this.routes = {};
};
Doppelganger.Router.prototype = {
	add: du.getterSetterCreator('routes'),
	get: du.getterSetterCreator('routes'),
	recognize: function (fullUrl) {
		return this.router.recognize(fullUrl);
	},
	generate: function (name, params) {
		//because Sherpa mutates params we hand it a copy instead.
		return this.router.generate(name, du.extend({}, params));
	}
};