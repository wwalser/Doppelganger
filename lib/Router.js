Doppelganger.Router = function(rootUrl, options) {
this.router = new Sherpa.Router(),
	this.baseUrl = rootUrl;
	this.options = du.extend({}, options);
};
Doppelganger.Router.prototype = {
	recognize: function (fullUrl) {
		return this.router.recognize(fullUrl);
	},
	generate: function (name, params) {
		//because Sherpa mutates params we hand it a copy instead.
		return this.router.generate(name, du.extend({}, params));
	}
};