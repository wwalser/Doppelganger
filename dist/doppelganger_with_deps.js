(function(global){

  /**
   * MakeArg makes the Arg namespace.
   * var Arg = MakeArg();
   */
  global.MakeArg = function(){

    /** @namespace
     */
    var Arg = function(){
      return Arg.get.apply(global, arguments);
    };
    Arg.version = "1.0.1";

    /**
     * Parses the arg string into an Arg.Arg object.
     */
    Arg.parse = function(s){
      if (!s) return {};
      if (s.indexOf("=")===-1 && s.indexOf("&")===-1) return {};
      s = Arg._cleanParamStr(s);
      var obj = {};
      var pairs = s.split("&");
      for (var pi in pairs) {
        var kvsegs = pairs[pi].split("=");
        var key = decodeURIComponent(kvsegs[0]), val = decodeURIComponent(kvsegs[1]);
        Arg._access(obj, key, val);
      }
      return obj;
    };

    /**
     * Helper method to get/set deep nested values in an object based on a string selector
     *
     * @param  {Object}  obj        Based object to either get/set selector on
     * @param  {String}  selector   Object selector ie foo[0][1].bar[0].baz.foobar
     * @param  {Mixed}   value      (optional) Value to set leaf located at `selector` to.
     *                              If value is undefined, operates in 'get' mode to return value at obj->selector
     * @return {Mixed}
     */
    Arg._access = function(obj, selector, value) {
      var shouldSet = typeof value !== "undefined";
      var selectorBreak = -1;
      var coerce_types = {
        'true'  : true,
        'false' : false,
        'null'  : null
      };

      // selector could be a number if we're at a numerical index leaf in which case selector.search is not valid
      if (typeof selector == 'string' || toString.call(selector) == '[object String]') {
        selectorBreak = selector.search(/[\.\[]/);
      }

      // No dot or array notation so we're at a leaf, set value
      if (selectorBreak === -1) {
        if (Arg.coerceMode) {
          value = value && !isNaN(value)            ? +value              // number
                : value === 'undefined'             ? undefined           // undefined
                : coerce_types[value] !== undefined ? coerce_types[value] // true, false, null
                : value;                                                  // string
        }
        return shouldSet ? (obj[selector] = value) : obj[selector];
      }

      // Example:
      // selector     = 'foo[0].bar.baz[2]'
      // currentRoot  = 'foo'
      // nextSelector = '0].bar.baz[2]' -> will be converted to '0.bar.baz[2]' in below switch statement
      var currentRoot = selector.substr(0, selectorBreak);
      var nextSelector = selector.substr(selectorBreak + 1);

      switch (selector.charAt(selectorBreak)) {
        case '[':
          // Intialize node as an array if we haven't visted it before
          obj[currentRoot] = obj[currentRoot] || [];
          nextSelector = nextSelector.replace(']', '');

          if (nextSelector.search(/[\.\[]/) === -1) {
            nextSelector = parseInt(nextSelector, 10);
          }

          return Arg._access(obj[currentRoot], nextSelector, value);
        case '.':
          // Intialize node as an object if we haven't visted it before
          obj[currentRoot] = obj[currentRoot] || {};
          return Arg._access(obj[currentRoot], nextSelector, value);
      }

      return obj;
    };

    /**
     * Turns the specified object into a URL parameter string.
     */
    Arg.stringify = function(obj, keyPrefix) {

      switch (typeof(obj)) {
      case "object":
        var segs = [];
        var thisKey;
        for (var key in obj) {

          if (!obj.hasOwnProperty(key)) continue;
          var val = obj[key];

          if (typeof(key) === "undefined" || key.length === 0 || typeof(val) === "undefined") continue;

          thisKey = keyPrefix ? keyPrefix+"."+key : key;

          if (typeof obj.length !== "undefined") {
            thisKey = keyPrefix ? keyPrefix+"["+key+"]" : key;
          }

          if (typeof val === "object") {
            segs.push(Arg.stringify(val, thisKey));
          } else {
            segs.push(encodeURIComponent(thisKey)+"="+encodeURIComponent(val));
          }

        }
        return segs.join("&");
      }

      return encodeURIComponent(obj);

    };

    /**
     * Generates a URL with the given parameters.
     * (object) = A URL to the current page with the specified parameters.
     * (path, object) = A URL to the specified path, with the object of parameters.
     * (path, object, object) = A URL to the specified path with the first object as query parameters,
     * and the second object as hash parameters.
     */
    Arg.url = function(){

      var sep = (Arg.urlUseHash ? Arg.hashQuerySeperator : Arg.querySeperator);
      var segs = [location.pathname, sep];
      var args = {};

      switch (arguments.length) {
      case 1: // Arg.url(params)
        segs.push(Arg.stringify(arguments[0]));
        break;
      case 2: // Arg.url(path, params)
        segs[0] = Arg._cleanPath(arguments[0]);
        args = Arg.parse(arguments[0]);
        args = Arg.merge(args, arguments[1]);
        segs.push(Arg.stringify(args));
        break;
      case 3: // Arg.url(path, query, hash)
        segs[0] = Arg._cleanPath(arguments[0]);
        segs[1] = Arg.querySeperator;
        segs.push(Arg.stringify(arguments[1]));
        (typeof(arguments[2])==="string") ? segs.push(Arg.hashSeperator) : segs.push(Arg.hashQuerySeperator);
        segs.push(Arg.stringify(arguments[2]));
      }

      var s = segs.join("");

      // trim off sep if it's the last thing
      if (s.indexOf(sep) == s.length - sep.length) {
        s = s.substr(0, s.length - sep.length);
      }

      return s;

    };

    /** urlUseHash tells the Arg.url method to always put the parameters in the hash. */
    Arg.urlUseHash = false;

    /** The string that seperates the path and query parameters. */
    Arg.querySeperator = "?";

    /** The string that seperates the path or query, and the hash property. */
    Arg.hashSeperator = "#";

    /** The string that seperates the the path or query, and the hash query parameters. */
    Arg.hashQuerySeperator = "#?";

    /** When parsing values if they should be coerced into primitive types, ie Number, Boolean, Undefined */
    Arg.coerceMode = true;

    /**
     * Gets all parameters from the current URL.
     */
    Arg.all = function(){
      var merged = Arg.parse(Arg.querystring() + "&" + Arg.hashstring());
      return Arg._all ? Arg._all : Arg._all = merged;
    };

    /**
     * Gets a parameter from the URL.
     */
    Arg.get = function(selector, def){
      var val = Arg._access(Arg.all(), selector);
      return typeof(val) === "undefined" ? def : val;
    };

    /**
     * Gets the query string parameters from the current URL.
     */
    Arg.query = function(){
      return Arg._query ? Arg._query : Arg._query = Arg.parse(Arg.querystring());
    };

    /**
     * Gets the hash string parameters from the current URL.
     */
    Arg.hash = function(){
      return Arg._hash ? Arg._hash : Arg._hash = Arg.parse(Arg.hashstring());
    };

    /**
     * Gets the query string from the URL (the part after the ?).
     */
    Arg.querystring = function(){
      return Arg._cleanParamStr(location.search);
    };

    /**
     * Gets the hash param string from the URL (the part after the #).
     */
    Arg.hashstring = function(){
      return Arg._cleanParamStr(location.hash)
    };

    /*
     * Cleans the URL parameter string stripping # and ? from the beginning.
     */
    Arg._cleanParamStr = function(s){

      if (s.indexOf(Arg.querySeperator)>-1)
        s = s.split(Arg.querySeperator)[1];

      if (s.indexOf(Arg.hashSeperator)>-1)
        s = s.split(Arg.hashSeperator)[1];

      if (s.indexOf("=")===-1 && s.indexOf("&")===-1)
        return "";

      while (s.indexOf(Arg.hashSeperator) == 0 || s.indexOf(Arg.querySeperator) == 0)
        s = s.substr(1);

      return s;
    };

    Arg._cleanPath = function(p){

      if (p.indexOf(Arg.querySeperator)>-1)
        p = p.substr(0,p.indexOf(Arg.querySeperator));

      if (p.indexOf(Arg.hashSeperator)>-1)
        p = p.substr(0,p.indexOf(Arg.hashSeperator));

      return p;
    };

    /**
     * Merges all the arguments into a new object.
     */
    Arg.merge = function(){
      var all = {};
      for (var ai in arguments)
        for (var k in arguments[ai])
          all[k] = arguments[ai][k];
      return all;
    };

    return Arg;

  };

  /** @namespace
   * Arg is the root namespace for all arg.js functionality.
   */
  global.Arg = MakeArg();

})(window);

(function(e,t){"use strict";var n=e.History=e.History||{};if(typeof n.Adapter!="undefined")throw new Error("History.js Adapter has already been loaded...");n.Adapter={handlers:{},_uid:1,uid:function(e){return e._uid||(e._uid=n.Adapter._uid++)},bind:function(e,t,r){var i=n.Adapter.uid(e);n.Adapter.handlers[i]=n.Adapter.handlers[i]||{},n.Adapter.handlers[i][t]=n.Adapter.handlers[i][t]||[],n.Adapter.handlers[i][t].push(r),e["on"+t]=function(e,t){return function(r){n.Adapter.trigger(e,t,r)}}(e,t)},trigger:function(e,t,r){r=r||{};var i=n.Adapter.uid(e),s,o;n.Adapter.handlers[i]=n.Adapter.handlers[i]||{},n.Adapter.handlers[i][t]=n.Adapter.handlers[i][t]||[];for(s=0,o=n.Adapter.handlers[i][t].length;s<o;++s)n.Adapter.handlers[i][t][s].apply(this,[r])},extractEventData:function(e,n){var r=n&&n[e]||t;return r},onDomLoad:function(t){var n=e.setTimeout(function(){t()},2e3);e.onload=function(){clearTimeout(n),t()}}},typeof n.init!="undefined"&&n.init()})(window),function(e,t){"use strict";var n=e.console||t,r=e.document,i=e.navigator,s=!1,o=e.setTimeout,u=e.clearTimeout,a=e.setInterval,f=e.clearInterval,l=e.JSON,c=e.alert,h=e.History=e.History||{},p=e.history;try{s=e.sessionStorage,s.setItem("TEST","1"),s.removeItem("TEST")}catch(d){s=!1}l.stringify=l.stringify||l.encode,l.parse=l.parse||l.decode;if(typeof h.init!="undefined")throw new Error("History.js Core has already been loaded...");h.init=function(e){return typeof h.Adapter=="undefined"?!1:(typeof h.initCore!="undefined"&&h.initCore(),typeof h.initHtml4!="undefined"&&h.initHtml4(),!0)},h.initCore=function(d){if(typeof h.initCore.initialized!="undefined")return!1;h.initCore.initialized=!0,h.options=h.options||{},h.options.hashChangeInterval=h.options.hashChangeInterval||100,h.options.safariPollInterval=h.options.safariPollInterval||500,h.options.doubleCheckInterval=h.options.doubleCheckInterval||500,h.options.disableSuid=h.options.disableSuid||!1,h.options.storeInterval=h.options.storeInterval||1e3,h.options.busyDelay=h.options.busyDelay||250,h.options.debug=h.options.debug||!1,h.options.initialTitle=h.options.initialTitle||r.title,h.options.html4Mode=h.options.html4Mode||!1,h.options.delayInit=h.options.delayInit||!1,h.intervalList=[],h.clearAllIntervals=function(){var e,t=h.intervalList;if(typeof t!="undefined"&&t!==null){for(e=0;e<t.length;e++)f(t[e]);h.intervalList=null}},h.debug=function(){(h.options.debug||!1)&&h.log.apply(h,arguments)},h.log=function(){var e=typeof n!="undefined"&&typeof n.log!="undefined"&&typeof n.log.apply!="undefined",t=r.getElementById("log"),i,s,o,u,a;e?(u=Array.prototype.slice.call(arguments),i=u.shift(),typeof n.debug!="undefined"?n.debug.apply(n,[i,u]):n.log.apply(n,[i,u])):i="\n"+arguments[0]+"\n";for(s=1,o=arguments.length;s<o;++s){a=arguments[s];if(typeof a=="object"&&typeof l!="undefined")try{a=l.stringify(a)}catch(f){}i+="\n"+a+"\n"}return t?(t.value+=i+"\n-----\n",t.scrollTop=t.scrollHeight-t.clientHeight):e||c(i),!0},h.getInternetExplorerMajorVersion=function(){var e=h.getInternetExplorerMajorVersion.cached=typeof h.getInternetExplorerMajorVersion.cached!="undefined"?h.getInternetExplorerMajorVersion.cached:function(){var e=3,t=r.createElement("div"),n=t.getElementsByTagName("i");while((t.innerHTML="<!--[if gt IE "+ ++e+"]><i></i><![endif]-->")&&n[0]);return e>4?e:!1}();return e},h.isInternetExplorer=function(){var e=h.isInternetExplorer.cached=typeof h.isInternetExplorer.cached!="undefined"?h.isInternetExplorer.cached:Boolean(h.getInternetExplorerMajorVersion());return e},h.options.html4Mode?h.emulated={pushState:!0,hashChange:!0}:h.emulated={pushState:!Boolean(e.history&&e.history.pushState&&e.history.replaceState&&!/ Mobile\/([1-7][a-z]|(8([abcde]|f(1[0-8]))))/i.test(i.userAgent)&&!/AppleWebKit\/5([0-2]|3[0-2])/i.test(i.userAgent)),hashChange:Boolean(!("onhashchange"in e||"onhashchange"in r)||h.isInternetExplorer()&&h.getInternetExplorerMajorVersion()<8)},h.enabled=!h.emulated.pushState,h.bugs={setHash:Boolean(!h.emulated.pushState&&i.vendor==="Apple Computer, Inc."&&/AppleWebKit\/5([0-2]|3[0-3])/.test(i.userAgent)),safariPoll:Boolean(!h.emulated.pushState&&i.vendor==="Apple Computer, Inc."&&/AppleWebKit\/5([0-2]|3[0-3])/.test(i.userAgent)),ieDoubleCheck:Boolean(h.isInternetExplorer()&&h.getInternetExplorerMajorVersion()<8),hashEscape:Boolean(h.isInternetExplorer()&&h.getInternetExplorerMajorVersion()<7)},h.isEmptyObject=function(e){for(var t in e)if(e.hasOwnProperty(t))return!1;return!0},h.cloneObject=function(e){var t,n;return e?(t=l.stringify(e),n=l.parse(t)):n={},n},h.getRootUrl=function(){var e=r.location.protocol+"//"+(r.location.hostname||r.location.host);if(r.location.port||!1)e+=":"+r.location.port;return e+="/",e},h.getBaseHref=function(){var e=r.getElementsByTagName("base"),t=null,n="";return e.length===1&&(t=e[0],n=t.href.replace(/[^\/]+$/,"")),n=n.replace(/\/+$/,""),n&&(n+="/"),n},h.getBaseUrl=function(){var e=h.getBaseHref()||h.getBasePageUrl()||h.getRootUrl();return e},h.getPageUrl=function(){var e=h.getState(!1,!1),t=(e||{}).url||h.getLocationHref(),n;return n=t.replace(/\/+$/,"").replace(/[^\/]+$/,function(e,t,n){return/\./.test(e)?e:e+"/"}),n},h.getBasePageUrl=function(){var e=h.getLocationHref().replace(/[#\?].*/,"").replace(/[^\/]+$/,function(e,t,n){return/[^\/]$/.test(e)?"":e}).replace(/\/+$/,"")+"/";return e},h.getFullUrl=function(e,t){var n=e,r=e.substring(0,1);return t=typeof t=="undefined"?!0:t,/[a-z]+\:\/\//.test(e)||(r==="/"?n=h.getRootUrl()+e.replace(/^\/+/,""):r==="#"?n=h.getPageUrl().replace(/#.*/,"")+e:r==="?"?n=h.getPageUrl().replace(/[\?#].*/,"")+e:t?n=h.getBaseUrl()+e.replace(/^(\.\/)+/,""):n=h.getBasePageUrl()+e.replace(/^(\.\/)+/,"")),n.replace(/\#$/,"")},h.getShortUrl=function(e){var t=e,n=h.getBaseUrl(),r=h.getRootUrl();return h.emulated.pushState&&(t=t.replace(n,"")),t=t.replace(r,"/"),h.isTraditionalAnchor(t)&&(t="./"+t),t=t.replace(/^(\.\/)+/g,"./").replace(/\#$/,""),t},h.getLocationHref=function(e){return e=e||r,e.URL===e.location.href?e.location.href:e.location.href===decodeURIComponent(e.URL)?e.URL:e.location.hash&&decodeURIComponent(e.location.href.replace(/^[^#]+/,""))===e.location.hash?e.location.href:e.URL.indexOf("#")==-1&&e.location.href.indexOf("#")!=-1?e.location.href:e.URL||e.location.href},h.store={},h.idToState=h.idToState||{},h.stateToId=h.stateToId||{},h.urlToId=h.urlToId||{},h.storedStates=h.storedStates||[],h.savedStates=h.savedStates||[],h.normalizeStore=function(){h.store.idToState=h.store.idToState||{},h.store.urlToId=h.store.urlToId||{},h.store.stateToId=h.store.stateToId||{}},h.getState=function(e,t){typeof e=="undefined"&&(e=!0),typeof t=="undefined"&&(t=!0);var n=h.getLastSavedState();return!n&&t&&(n=h.createStateObject()),e&&(n=h.cloneObject(n),n.url=n.cleanUrl||n.url),n},h.getIdByState=function(e){var t=h.extractId(e.url),n;if(!t){n=h.getStateString(e);if(typeof h.stateToId[n]!="undefined")t=h.stateToId[n];else if(typeof h.store.stateToId[n]!="undefined")t=h.store.stateToId[n];else{for(;;){t=(new Date).getTime()+String(Math.random()).replace(/\D/g,"");if(typeof h.idToState[t]=="undefined"&&typeof h.store.idToState[t]=="undefined")break}h.stateToId[n]=t,h.idToState[t]=e}}return t},h.normalizeState=function(e){var t,n;if(!e||typeof e!="object")e={};if(typeof e.normalized!="undefined")return e;if(!e.data||typeof e.data!="object")e.data={};return t={},t.normalized=!0,t.title=e.title||"",t.url=h.getFullUrl(e.url?e.url:h.getLocationHref()),t.hash=h.getShortUrl(t.url),t.data=h.cloneObject(e.data),t.id=h.getIdByState(t),t.cleanUrl=t.url.replace(/\??\&_suid.*/,""),t.url=t.cleanUrl,n=!h.isEmptyObject(t.data),(t.title||n)&&h.options.disableSuid!==!0&&(t.hash=h.getShortUrl(t.url).replace(/\??\&_suid.*/,""),/\?/.test(t.hash)||(t.hash+="?"),t.hash+="&_suid="+t.id),t.hashedUrl=h.getFullUrl(t.hash),(h.emulated.pushState||h.bugs.safariPoll)&&h.hasUrlDuplicate(t)&&(t.url=t.hashedUrl),t},h.createStateObject=function(e,t,n){var r={data:e,title:t,url:n};return r=h.normalizeState(r),r},h.getStateById=function(e){e=String(e);var n=h.idToState[e]||h.store.idToState[e]||t;return n},h.getStateString=function(e){var t,n,r;return t=h.normalizeState(e),n={data:t.data,title:e.title,url:e.url},r=l.stringify(n),r},h.getStateId=function(e){var t,n;return t=h.normalizeState(e),n=t.id,n},h.getHashByState=function(e){var t,n;return t=h.normalizeState(e),n=t.hash,n},h.extractId=function(e){var t,n,r,i;return e.indexOf("#")!=-1?i=e.split("#")[0]:i=e,n=/(.*)\&_suid=([0-9]+)$/.exec(i),r=n?n[1]||e:e,t=n?String(n[2]||""):"",t||!1},h.isTraditionalAnchor=function(e){var t=!/[\/\?\.]/.test(e);return t},h.extractState=function(e,t){var n=null,r,i;return t=t||!1,r=h.extractId(e),r&&(n=h.getStateById(r)),n||(i=h.getFullUrl(e),r=h.getIdByUrl(i)||!1,r&&(n=h.getStateById(r)),!n&&t&&!h.isTraditionalAnchor(e)&&(n=h.createStateObject(null,null,i))),n},h.getIdByUrl=function(e){var n=h.urlToId[e]||h.store.urlToId[e]||t;return n},h.getLastSavedState=function(){return h.savedStates[h.savedStates.length-1]||t},h.getLastStoredState=function(){return h.storedStates[h.storedStates.length-1]||t},h.hasUrlDuplicate=function(e){var t=!1,n;return n=h.extractState(e.url),t=n&&n.id!==e.id,t},h.storeState=function(e){return h.urlToId[e.url]=e.id,h.storedStates.push(h.cloneObject(e)),e},h.isLastSavedState=function(e){var t=!1,n,r,i;return h.savedStates.length&&(n=e.id,r=h.getLastSavedState(),i=r.id,t=n===i),t},h.saveState=function(e){return h.isLastSavedState(e)?!1:(h.savedStates.push(h.cloneObject(e)),!0)},h.getStateByIndex=function(e){var t=null;return typeof e=="undefined"?t=h.savedStates[h.savedStates.length-1]:e<0?t=h.savedStates[h.savedStates.length+e]:t=h.savedStates[e],t},h.getCurrentIndex=function(){var e=null;return h.savedStates.length<1?e=0:e=h.savedStates.length-1,e},h.getHash=function(e){var t=h.getLocationHref(e),n;return n=h.getHashByUrl(t),n},h.unescapeHash=function(e){var t=h.normalizeHash(e);return t=decodeURIComponent(t),t},h.normalizeHash=function(e){var t=e.replace(/[^#]*#/,"").replace(/#.*/,"");return t},h.setHash=function(e,t){var n,i;return t!==!1&&h.busy()?(h.pushQueue({scope:h,callback:h.setHash,args:arguments,queue:t}),!1):(h.busy(!0),n=h.extractState(e,!0),n&&!h.emulated.pushState?h.pushState(n.data,n.title,n.url,!1):h.getHash()!==e&&(h.bugs.setHash?(i=h.getPageUrl(),h.pushState(null,null,i+"#"+e,!1)):r.location.hash=e),h)},h.escapeHash=function(t){var n=h.normalizeHash(t);return n=e.encodeURIComponent(n),h.bugs.hashEscape||(n=n.replace(/\%21/g,"!").replace(/\%26/g,"&").replace(/\%3D/g,"=").replace(/\%3F/g,"?")),n},h.getHashByUrl=function(e){var t=String(e).replace(/([^#]*)#?([^#]*)#?(.*)/,"$2");return t=h.unescapeHash(t),t},h.setTitle=function(e){var t=e.title,n;t||(n=h.getStateByIndex(0),n&&n.url===e.url&&(t=n.title||h.options.initialTitle));try{r.getElementsByTagName("title")[0].innerHTML=t.replace("<","&lt;").replace(">","&gt;").replace(" & "," &amp; ")}catch(i){}return r.title=t,h},h.queues=[],h.busy=function(e){typeof e!="undefined"?h.busy.flag=e:typeof h.busy.flag=="undefined"&&(h.busy.flag=!1);if(!h.busy.flag){u(h.busy.timeout);var t=function(){var e,n,r;if(h.busy.flag)return;for(e=h.queues.length-1;e>=0;--e){n=h.queues[e];if(n.length===0)continue;r=n.shift(),h.fireQueueItem(r),h.busy.timeout=o(t,h.options.busyDelay)}};h.busy.timeout=o(t,h.options.busyDelay)}return h.busy.flag},h.busy.flag=!1,h.fireQueueItem=function(e){return e.callback.apply(e.scope||h,e.args||[])},h.pushQueue=function(e){return h.queues[e.queue||0]=h.queues[e.queue||0]||[],h.queues[e.queue||0].push(e),h},h.queue=function(e,t){return typeof e=="function"&&(e={callback:e}),typeof t!="undefined"&&(e.queue=t),h.busy()?h.pushQueue(e):h.fireQueueItem(e),h},h.clearQueue=function(){return h.busy.flag=!1,h.queues=[],h},h.stateChanged=!1,h.doubleChecker=!1,h.doubleCheckComplete=function(){return h.stateChanged=!0,h.doubleCheckClear(),h},h.doubleCheckClear=function(){return h.doubleChecker&&(u(h.doubleChecker),h.doubleChecker=!1),h},h.doubleCheck=function(e){return h.stateChanged=!1,h.doubleCheckClear(),h.bugs.ieDoubleCheck&&(h.doubleChecker=o(function(){return h.doubleCheckClear(),h.stateChanged||e(),!0},h.options.doubleCheckInterval)),h},h.safariStatePoll=function(){var t=h.extractState(h.getLocationHref()),n;if(!h.isLastSavedState(t))return n=t,n||(n=h.createStateObject()),h.Adapter.trigger(e,"popstate"),h;return},h.back=function(e){return e!==!1&&h.busy()?(h.pushQueue({scope:h,callback:h.back,args:arguments,queue:e}),!1):(h.busy(!0),h.doubleCheck(function(){h.back(!1)}),p.go(-1),!0)},h.forward=function(e){return e!==!1&&h.busy()?(h.pushQueue({scope:h,callback:h.forward,args:arguments,queue:e}),!1):(h.busy(!0),h.doubleCheck(function(){h.forward(!1)}),p.go(1),!0)},h.go=function(e,t){var n;if(e>0)for(n=1;n<=e;++n)h.forward(t);else{if(!(e<0))throw new Error("History.go: History.go requires a positive or negative integer passed.");for(n=-1;n>=e;--n)h.back(t)}return h};if(h.emulated.pushState){var v=function(){};h.pushState=h.pushState||v,h.replaceState=h.replaceState||v}else h.onPopState=function(t,n){var r=!1,i=!1,s,o;return h.doubleCheckComplete(),s=h.getHash(),s?(o=h.extractState(s||h.getLocationHref(),!0),o?h.replaceState(o.data,o.title,o.url,!1):(h.Adapter.trigger(e,"anchorchange"),h.busy(!1)),h.expectedStateId=!1,!1):(r=h.Adapter.extractEventData("state",t,n)||!1,r?i=h.getStateById(r):h.expectedStateId?i=h.getStateById(h.expectedStateId):i=h.extractState(h.getLocationHref()),i||(i=h.createStateObject(null,null,h.getLocationHref())),h.expectedStateId=!1,h.isLastSavedState(i)?(h.busy(!1),!1):(h.storeState(i),h.saveState(i),h.setTitle(i),h.Adapter.trigger(e,"statechange"),h.busy(!1),!0))},h.Adapter.bind(e,"popstate",h.onPopState),h.pushState=function(t,n,r,i){if(h.getHashByUrl(r)&&h.emulated.pushState)throw new Error("History.js does not support states with fragement-identifiers (hashes/anchors).");if(i!==!1&&h.busy())return h.pushQueue({scope:h,callback:h.pushState,args:arguments,queue:i}),!1;h.busy(!0);var s=h.createStateObject(t,n,r);return h.isLastSavedState(s)?h.busy(!1):(h.storeState(s),h.expectedStateId=s.id,p.pushState(s.id,s.title,s.url),h.Adapter.trigger(e,"popstate")),!0},h.replaceState=function(t,n,r,i){if(h.getHashByUrl(r)&&h.emulated.pushState)throw new Error("History.js does not support states with fragement-identifiers (hashes/anchors).");if(i!==!1&&h.busy())return h.pushQueue({scope:h,callback:h.replaceState,args:arguments,queue:i}),!1;h.busy(!0);var s=h.createStateObject(t,n,r);return h.isLastSavedState(s)?h.busy(!1):(h.storeState(s),h.expectedStateId=s.id,p.replaceState(s.id,s.title,s.url),h.Adapter.trigger(e,"popstate")),!0};if(s){try{h.store=l.parse(s.getItem("History.store"))||{}}catch(m){h.store={}}h.normalizeStore()}else h.store={},h.normalizeStore();h.Adapter.bind(e,"unload",h.clearAllIntervals),h.saveState(h.storeState(h.extractState(h.getLocationHref(),!0))),s&&(h.onUnload=function(){var e,t,n;try{e=l.parse(s.getItem("History.store"))||{}}catch(r){e={}}e.idToState=e.idToState||{},e.urlToId=e.urlToId||{},e.stateToId=e.stateToId||{};for(t in h.idToState){if(!h.idToState.hasOwnProperty(t))continue;e.idToState[t]=h.idToState[t]}for(t in h.urlToId){if(!h.urlToId.hasOwnProperty(t))continue;e.urlToId[t]=h.urlToId[t]}for(t in h.stateToId){if(!h.stateToId.hasOwnProperty(t))continue;e.stateToId[t]=h.stateToId[t]}h.store=e,h.normalizeStore(),n=l.stringify(e);try{s.setItem("History.store",n)}catch(i){if(i.code!==DOMException.QUOTA_EXCEEDED_ERR)throw i;s.length&&(s.removeItem("History.store"),s.setItem("History.store",n))}},h.intervalList.push(a(h.onUnload,h.options.storeInterval)),h.Adapter.bind(e,"beforeunload",h.onUnload),h.Adapter.bind(e,"unload",h.onUnload));if(!h.emulated.pushState){h.bugs.safariPoll&&h.intervalList.push(a(h.safariStatePoll,h.options.safariPollInterval));if(i.vendor==="Apple Computer, Inc."||(i.appCodeName||"")==="Mozilla")h.Adapter.bind(e,"hashchange",function(){h.Adapter.trigger(e,"popstate")}),h.getHash()&&h.Adapter.onDomLoad(function(){h.Adapter.trigger(e,"hashchange")})}},(!h.options||!h.options.delayInit)&&h.init()}(window)
if (!Array.prototype.indexOf)
{
    Array.prototype.indexOf = function(searchElement /*, fromIndex */)
    {
        "use strict";

        if (this === void 0 || this === null)
            throw new TypeError();

        var t = Object(this);
        var len = t.length >>> 0;
        if (len === 0)
            return -1;

        var n = 0;
        if (arguments.length > 0)
        {
            n = Number(arguments[1]);
            if (n !== n) // shortcut for verifying if it's NaN
                n = 0;
            else if (n !== 0 && n !== (1 / 0) && n !== -(1 / 0))
                n = (n > 0 || -1) * Math.floor(Math.abs(n));
        }

        if (n >= len)
            return -1;

        var k = n >= 0
            ? n
            : Math.max(len - Math.abs(n), 0);

        for (; k < len; k++)
        {
            if (k in t && t[k] === searchElement)
                return k;
        }
        return -1;
    };
}

RegExp.escape = function(text) {
    if (!arguments.callee.sRE) {
        var specials = [
            '/', '.', '*', '+', '?', '|',
            '(', ')', '[', ']', '{', '}', '\\'
        ];
        arguments.callee.sRE = new RegExp(
            '(\\' + specials.join('|\\') + ')', 'g'
        );
    }
    return text.replace(arguments.callee.sRE, '\\$1');
}

Sherpa = {
    Router: function(options) {
        this.routes = {};
        this.root = new Sherpa.Node();
        this.requestKeys = options && options['requestKeys'] || ['method'];
    },
    Path: function(route, uri) {
        this.route = route;
        var splitUri = this.pathSplit(uri);

        this.compiledUri = [];

        for (var splitUriIdx = 0; splitUriIdx != splitUri.length; splitUriIdx++) {
            if (splitUri[splitUriIdx].substring(0, 1) == ':') {
                this.compiledUri.push("params['" + splitUri[splitUriIdx].substring(1) + "']");
            } else {
                this.compiledUri.push("'" + splitUri[splitUriIdx] + "'");
            }
        }

        this.compiledUri = this.compiledUri.join('+');

        this.groups = [];

        for (var splitIndex = 0; splitIndex < splitUri.length; splitIndex++) {
            var part = splitUri[splitIndex];
            if (part == '/') {
                this.groups.push([]);
            } else if (part != '') {
                this.groups[this.groups.length - 1].push(part);
            }
        }
    },
    Route: function(router, uri) {
        this.router = router;
        this.requestConditions = {};
        this.matchingConditions = {};
        this.variableNames = [];
        var paths = [""];
        var chars = uri.split('');

        var startIndex = 0;
        var endIndex = 1;

        for (var charIndex = 0; charIndex < chars.length; charIndex++) {
            var c = chars[charIndex];
            if (c == '(') {
                // over current working set, double paths
                for (var pathIndex = startIndex; pathIndex != endIndex; pathIndex++) {
                    paths.push(paths[pathIndex]);
                }
                // move working set to newly copied paths
                startIndex = endIndex;
                endIndex = paths.length;
            } else if (c == ')') {
                // expand working set scope
                startIndex -= (endIndex - startIndex);
            } else {
                for (var i = startIndex; i != endIndex; i++) {
                    paths[i] += c;
                }
            }
        }

        this.partial = false;
        this.paths = [];
        for (var pathsIdx = 0; pathsIdx != paths.length; pathsIdx++) {
            this.paths.push(new Sherpa.Path(this, paths[pathsIdx]));
        }
    },
    Node: function() {
        this.reset();
    },
    Response: function(path, params) {
        this.path = path
        this.route = path.route;
        this.paramsArray = params;
        this.destination = this.route.destination;
        this.params = {};
        for (var varIdx = 0; varIdx != this.path.variableNames.length; varIdx++) {
            this.params[this.path.variableNames[varIdx]] = this.paramsArray[varIdx];
        }
    }
};

Sherpa.Node.prototype = {
    reset: function() {
        this.linear = [];
        this.lookup = {};
        this.catchall = null;
    },
    dup: function() {
        var newNode = new Sherpa.Node();
        for(var idx = 0; idx != this.linear.length; idx++) {
            newNode.linear.push(this.linear[idx]);
        }
        for(var key in this.lookup) {
            newNode.lookup[key] = this.lookup[key];
        }
        newNode.catchall = this.catchall;
        return newNode;
    },
    addLinear: function(regex, count) {
        var newNode = new Sherpa.Node();
        this.linear.push([regex, count, newNode]);
        return newNode;
    },
    addCatchall: function() {
        if (!this.catchall) {
            this.catchall = new Sherpa.Node();
        }
        return this.catchall;
    },
    addLookup: function(part) {
        if (!this.lookup[part]) {
            this.lookup[part] = new Sherpa.Node();
        }
        return this.lookup[part];
    },
    addRequestNode: function() {
        if (!this.requestNode) {
            this.requestNode = new Sherpa.Node();
            this.requestNode.requestMethod = null;
        }
        return this.requestNode;
    },
    find: function(parts, request, params) {
        if (this.requestNode || this.destination && this.destination.route.partial) {
            var target = this;
            if (target.requestNode) {
                target = target.requestNode.findRequest(request);
            }
            if (target && target.destination && target.destination.route.partial) {
                return new Sherpa.Response(target.destination, params);
            }
        }
        if (parts.length == 0) {
            var target = this;
            if (this.requestNode) {
                target = this.requestNode.findRequest(request);
            }
            return target && target.destination ? new Sherpa.Response(target.destination, params) : undefined;
        } else {
            if (this.linear.length != 0) {
                var wholePath = parts.join('/');
                for (var linearIdx = 0; linearIdx != this.linear.length; linearIdx++) {
                    var lin = this.linear[linearIdx];
                    var match = lin[0].exec(wholePath);
                    if (match) {
                        var matchedParams = [];
                        if (match[1] === undefined) {
                            matchedParams.push(match[0]);
                        } else {
                            for (var matchIdx = 1; matchIdx <= lin[1] + 1; matchIdx++) {
                                matchedParams.push(match[matchIdx]);
                            }
                        }

                        var newParams = params.concat(matchedParams);
                        matchedIndex = match.shift().length;
                        var resplitParts = wholePath.substring(matchedIndex).split('/');
                        if (resplitParts.length == 1 && resplitParts[0] == '') resplitParts.shift();
                        var potentialMatch = lin[2].find(resplitParts, request, newParams);
                        if (potentialMatch) return potentialMatch;
                    }
                }
            }
            if (this.lookup[parts[0]]) {
                var potentialMatch = this.lookup[parts[0]].find(parts.slice(1, parts.length), request, params);
                if (potentialMatch) return potentialMatch;
            }
            if (this.catchall) {
                var part = parts.shift();
                params.push(part);
                return this.catchall.find(parts, request, params);
            }
        }
        return undefined;
    },
    findRequest: function(request) {
        if (this.requestMethod) {
            if (this.linear.length != 0 && request[this.requestMethod]) {
                for (var linearIdx = 0; linearIdx != this.linear.length; linearIdx++) {
                    var lin = this.linear[linearIdx];
                    var match = lin[0].exec(request[this.requestMethod]);
                    if (match) {
                        matchedIndex = match.shift().length;
                        var potentialMatch = lin[2].findRequest(request);
                        if (potentialMatch) return potentialMatch;
                    }
                }
            }
            if (request[this.requestMethod] && this.lookup[request[this.requestMethod]]) {
                var potentialMatch = this.lookup[request[this.requestMethod]].findRequest(request);
                if (potentialMatch) {
                    return potentialMatch;
                }
            }
            if (this.catchall) {
                return this.catchall.findRequest(request);
            }
        } else if (this.destination) {
            return this;
        } else {
            return undefined;
        }
    },
    transplantValue: function() {
        if (this.destination && this.requestNode) {
            var targetNode = this.requestNode;
            while (targetNode.requestMethod) {
                targetNode = (targetNode.addCatchall());
            }
            targetNode.destination = this.destination;
            this.destination = undefined;
        }
    },
    compileRequestConditions: function(router, requestConditions) {
        var currentNodes = [this];
        var requestMethods = router.requestKeys;
        for (var requestMethodIdx in requestMethods) {
            var method = requestMethods[requestMethodIdx];
            if (requestConditions[method]) {// so, the request method we care about it ..
                if (currentNodes.length == 1 && currentNodes[0] === this) {
                    currentNodes = [this.addRequestNode()];
                }

                for (var currentNodeIndex = 0; currentNodeIndex != currentNodes.length; currentNodeIndex++) {
                    var currentNode = currentNodes[currentNodeIndex];
                    if (!currentNode.requestMethod) {
                        currentNode.requestMethod = method
                    }

                    var masterPosition = requestMethods.indexOf(method);
                    var currentPosition = requestMethods.indexOf(currentNode.requestMethod);

                    if (masterPosition == currentPosition) {
                        if (requestConditions[method].compile) {
                            currentNodes[currentNodeIndex] = currentNodes[currentNodeIndex].addLinear(requestConditions[method], 0);
                        } else {
                            currentNodes[currentNodeIndex] = currentNodes[currentNodeIndex].addLookup(requestConditions[method]);
                        }
                    } else if (masterPosition < currentPosition) {
                        currentNodes[currentNodeIndex] = currentNodes[currentNodeIndex].addCatchall();
                    } else {
                        var nextNode = currentNode.dup();
                        currentNode.reset();
                        currentNode.requestMethod = method;
                        currentNode.catchall = nextNode;
                        currentNodeIndex--;
                    }
                }
            } else {
                for (var currentNodeIndex = 0; currentNodeIndex != currentNodes.length; currentNodeIndex++) {
                    var node = currentNodes[currentNodeIndex];
                    if (!node.requestMethod && node.requestNode) {
                        node = node.requestNode;
                    }
                    if (node.requestMethod) {
                        currentNodes[currentNodeIndex] = node.addCatchall();
                        currentNodes[currentNodeIndex].requestMethod = null;
                    }
                }
            }
        }
        this.transplantValue();
        return currentNodes;
    }
};

Sherpa.Router.prototype = {
    generate: function(name, params) {
        return this.routes[name].generate(params);
    },
    add: function(uri, options) {
        var route = new Sherpa.Route(this, uri);
        if (options) route.withOptions(options);
        return route;
    },
    recognize: function(path, request) {
        if (path.substring(0,1) == '/') path = path.substring(1);
        return this.root.find(path == '' ? [] : path.split(/\//), request, []);
    }
};

Sherpa.Route.prototype = {
    withOptions: function(options) {
        if (options['conditions']) {
            this.condition(options['conditions']);
        }
        if (options['matchesWith']) {
            this.matchesWith(options['matchesWith']);
        }
        if (options['matchPartially']) {
            this.matchPartially(options['matchPartially']);
        }
        if (options['name']) {
            this.matchPartially(options['name']);
        }
        return this;
    },
    name: function(routeName) {
        this.router.routes[routeName] = this;
        return this;
    },
    matchPartially: function(partial) {
        this.partial = (partial === undefined || partial === true);
        return this;
    },
    matchesWith: function(matches) {
        for (var matchesKey in matches) {
            this.matchingConditions[matchesKey] = matches[matchesKey];
        }
        return this;
    },
    compile: function() {
        for(var pathIdx = 0; pathIdx != this.paths.length; pathIdx++) {
            this.paths[pathIdx].compile();
            for (var variableIdx = 0; variableIdx != this.paths[pathIdx].variableNames.length; variableIdx++) {
                if (this.variableNames.indexOf(this.paths[pathIdx].variableNames[variableIdx]) == -1) this.variableNames.push(this.paths[pathIdx].variableNames[variableIdx]);
            }
        }
    },
    to: function(destination) {
        this.compile();
        this.destination = destination;
        return this;
    },
    condition: function(conditions) {
        for (var conditionKey in conditions) {
            this.requestConditions[conditionKey] = conditions[conditionKey];
        }
        return this;
    },
    generate: function(params) {
        var path = undefined;
        if (params == undefined || this.paths.length == 1) {
            path = this.paths[0].generate(params);
        } else {
            for(var pathIdx = this.paths.length - 1; pathIdx >= 0; pathIdx--) {
                path = this.paths[pathIdx].generate(params);
                if (path) break;
            }
        }

        if (path) {
            path = encodeURI(path);
            var query = '';
            for (var key in params) {
                query += (query == '' ? '?' : '&') + encodeURIComponent(key) + '=' + encodeURIComponent(params[key]);
            }
            return path + query;
        } else {
            return undefined
        }
    }
};

Sherpa.Path.prototype = {
    pathSplit: function(path) {
        var splitParts = [];
        var parts = path.split('/');
        if (parts[0] == '') parts.shift();

        for(var i = 0; i != parts.length; i++) {
            splitParts.push("/");
            splitParts.push("");
            partChars = parts[i].split('');

            var inVariable = false;

            for (var j = 0; j != partChars.length; j++) {
                if (inVariable) {
                    var code = partChars[j].charCodeAt(0);
                    if ((code >= 48 && code <= 57) || (code >= 65 && code <= 90) || (code >= 97 && code <= 122) || code == 95) {
                        splitParts[splitParts.length - 1] += partChars[j];
                    } else {
                        inVariable = false;
                        splitParts.push(partChars[j]);
                    }
                } else if (partChars[j] == ':') {
                    inVariable = true;
                    if (splitParts[splitParts.length - 1] == '') {
                        splitParts[splitParts.length - 1] += ":";
                    } else {
                        splitParts.push(":");
                    }
                } else {
                    splitParts[splitParts.length - 1] += partChars[j];
                }
            }
        }
        return splitParts;
    },
    generate: function(params) {
        for(var varIdx = 0; varIdx != this.variableNames.length; varIdx++) {
            if (!params[this.variableNames[varIdx]]) return undefined;
        }
        for(var varIdx = 0; varIdx != this.variableNames.length; varIdx++) {
            if (this.route.matchingConditions[this.variableNames[varIdx]]) {
                if (this.route.matchingConditions[this.variableNames[varIdx]].exec(params[this.variableNames[varIdx]].toString()) != params[this.variableNames[varIdx]].toString()) {
                    return undefined;
                }
            }
        }
        var path = eval(this.compiledUri);
        for(var varIdx = 0; varIdx != this.variableNames.length; varIdx++) {
            delete params[this.variableNames[varIdx]];
        }
        return path;
    },
    compile: function() {
        this.variableNames = [];
        var currentNode = this.route.router.root;
        for(var groupIdx = 0; groupIdx != this.groups.length; groupIdx++) {
            var group = this.groups[groupIdx];
            if (group.length > 1) {
                var pattern = '^';
                for (var partIndex = 0; partIndex != group.length; partIndex++) {
                    var part = group[partIndex];
                    var captureCount = 0
                    if (part.substring(0,1) == ':') {
                        var variableName = part.substring(1);
                        this.variableNames.push(variableName);
                        pattern += this.route.matchingConditions[variableName] ? this.route.matchingConditions[variableName].toString() : '(.*?)'
                        captureCount += 1
                    } else {
                        pattern += RegExp.escape(part);
                    }
                }
                currentNode = currentNode.addLinear(new RegExp(pattern), captureCount);
            } else if (group.length == 1) {
                var part = group[0];
                if (part.substring(0,1) == ':') {
                    var variableName = part.substring(1);
                    this.variableNames.push(variableName);
                    if (this.route.matchingConditions[variableName]) {
                        currentNode = currentNode.addLinear(new RegExp(this.route.matchingConditions[variableName]), 1);
                    } else {
                        currentNode = currentNode.addCatchall();
                    }
                } else {
                    currentNode = currentNode.addLookup(part);
                }
            }
        }
        var nodes = currentNode.compileRequestConditions(this.route.router, this.route.requestConditions);
        for (var nodeIdx = 0; nodeIdx != nodes.length; nodeIdx++) {
            nodes[nodeIdx].destination = this;
        }
    }
};

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


//***** Native adapter (default) *****
//Doppelganger utils and selector
var du, $;
//useful protos
var arrayProto = Array.prototype;
//useful functions.
var slice = arrayProto.slice;
//natives
var nativeIsArray = arrayProto.isArray;
var nativeForEach = arrayProto.forEach;
var nativeIndexOf = arrayProto.indexOf;

//Events bound by du.util
var boundEvents = {};

Doppelganger.util = du = {
//Add routes and filters. 
	getterSetterCreator: function (name){
		return function(key, value){
			var obj = this[name];
			if (!value) {
				return obj[key];
			} else {
				obj[key] = value;
			}
		};
	},
	extend: function(obj){
		var iterable = slice.call(arguments, 1),
			source, i, prop;
		for (i = 0; i < iterable.length; i++) {
			source = iterable[i];
			if (source) {
				for (prop in source) {
					if (source.hasOwnProperty(prop)) {
						obj[prop] = source[prop];
					}
				}
			}
		}
		return obj;
	},
	each: function(obj, iterator, context) {
		if (obj == null) {
			return;
		}
		if (nativeForEach && obj.forEach === nativeForEach) {
			obj.forEach(iterator, context);
		} else if (obj.length === +obj.length) {
			for (var i = 0, length = obj.length; i < length; i++) {
				if (iterator.call(context, obj[i], i, obj) === false){
					return;
				}
			}
		} else {
			for (var key in obj) {
				if (obj.hasOwnProperty(key)) {
					if (iterator(obj[key], key, obj) === false) {
						break;
					}
				}
			}
		}
	},
	isArray: nativeIsArray || function(value) {
		return value && typeof value === 'object' && typeof value.length === 'number' &&
			value.toString() === '[object Array]' || false;
	},
	indexOf: function(array, item) {
		if (array == null) {
			return -1;
		}
		var i = 0, length = array.length;
		if (nativeIndexOf && array.indexOf === nativeIndexOf) {
			return array.indexOf(item);
		}
		for (; i < length; i++) {
			if (array[i] === item) {
				return i;
			}
		}
		return -1;
	},
	map: function(collection, callback){
		var index = -1,
			length = collection ? collection.length : 0,
			result = new Array(typeof length === 'number' ? length : 0);
		
		if (du.isArray(collection)) {
			while (++index < length) {
				result[index] = callback(collection[index], index, collection);
			}
		} else {
			du.each(collection, function(value, key, collection) {
				result[++index] = callback(value, key, collection);
			});
		}
		return result;
	},
	$: function(selector){
		return document.querySelectorAll(selector);
	},
	matchesSelector: function(elem, selector) {
		var fragment, elems;
		//use native otherwise querySelectorAll from parent node.
		if (elem.matches) {
			return elem.matches(selector);
		}
		// append to fragment if no parent
		if ( !elem.parentNode ) {
			if (elem === document) {
				return selector === 'document';
			}
			fragment = document.createDocumentFragment();
			fragment.appendChild( elem );
		}
		
		// match elem with all selected elems of parent
		elems = elem.parentNode.querySelectorAll( selector );
		for ( var i=0, len = elems.length; i < len; i++ ) {
			// return true if match
			if ( elems[i] === elem ) {
				return true;
			}
		}
		// otherwise return false
		return false;
	},
	closest: function(elem, selector) {
		var current = elem,
			found = false;
		while (current != null) {
			found = du.matchesSelector(current, selector);
			if (found) {
				break;
			}
			current = current.parentNode;
		}
		return found;
	},
	addEvent: function( elem, type, selector, fn ) {
		var eventProxy = fn;
		if (fn) {
			fn = function(event){
				var target = event.target || event.srcElement;
				if (du.closest(target, selector)) {
					eventProxy.apply(this, arguments);
				}
			};
		} else {
			fn = selector;
		}
        if ( elem.addEventListener ) {
            // Standards-based browsers
            elem.addEventListener( type, fn, false );
        } else if ( elem.attachEvent ) {
            // support: IE <9
            elem.attachEvent( "on" + type, fn );
        } else {
            // Caller must ensure support for event listeners is present
            throw new Error( "addEvent() was called in a context without event listener support" );
        }
		if (!boundEvents[type]) {
			boundEvents[type] = [];
		}
		boundEvents[type].push({
			fn: eventProxy,
			boundFn: fn,
			selector: typeof selector === 'string' ? selector : ''
		});
	},
	removeEvent: function(elem, type, selector, fn){
		var potentialEvents = boundEvents[type],
			length = potentialEvents ? potentialEvents.length : 0,
			i = 0,
			currentEvent, boundFn;

		for (; i < length; i++) {
			currentEvent = potentialEvents[i];
			if (fn === currentEvent.fn && selector === currentEvent.selector) {
				boundFn = currentEvent.boundFn;
				potentialEvents.splice(i, 1);
				break;
			}
		}

		if (boundFn) {
			if (elem.removeEventListener) {
				// Standards-based browsers
				elem.removeEventListener(type, boundFn);
			} else if (elem.detachEvent) {
				// support: IE <9
				elem.detachEvent(type, boundFn);
			} else {
				throw new Error( "removeEvent() was called in a context without event listener support" );
			}
		}
	}
};
$ = du.$;


var defaults = {
	rootUrl: '',
	routes: [{name: 'index', url: ''}],
	filters: ['RouterFilter', 'EventFilter']
};
var defaultAppObjectFields = {'routes': 'routeManager', 'filters': 'filterManager'};

/**
 * Create a new Doppelganger application.
 */
Doppelganger.create = function(appObj){
	var app = new Doppelganger();
	var field, propertyValue;
	app.options = du.extend({}, defaults, appObj);
	app.filterManager = new Doppelganger.FilterManager(app);
	app.routeManager = new Doppelganger.RouteManager(app, app.options.rootUrl);
	//Setup routes and filters that this application will use
	for (var property in defaultAppObjectFields) {
		if (defaultAppObjectFields.hasOwnProperty(property)){
			//respective handler for this property type [ex: 'filterManager']
			field = defaultAppObjectFields[property];
			//if the value isn't provided, fallback to defaults [ex: defaults.filters]
			propertyValue = app.options[property];
			//call the add method on respective handler [ex: app.filterManager.add(defaults.filters)]
			app[field]['add'](propertyValue);
		}
	}
	return app;
};

Doppelganger.prototype = {
	init: function(){
		var self = this;
		//do fancy things.
		History.Adapter.bind(window,'statechange', function(){
			var state = History.getState();
			//Fire filter chain.
			if (state.data.destination && !state.data.controllerStateChange) {
				//if controllerStateChange is true a controller has triggered this state change.
				//Otherwise use filter chain.
				self.trigger(state.data.destination, state.data.params);
			} else if (!state.data.destination) {
				self.trigger(self.startPage.destination, self.startPage.params);
			}
		});
		this.startPage = this.routeManager.recognize(window.location.pathname);
		this.navigate();
	},

	navigate: function(){
		//on initial load fire filter chain. On subsequent calls push state and the statechange handler will fire filters.
		this.navigate = function(name, params){
			//if pushstate, just use a full page reload.
			if (history.pushState) {
				History.pushState({destination: name, params: params}, document.title, this.routeManager.generate(name, params));
			} else {
				root.location = root.helpers.routing.generate(name, params);
			}
		};
		if (this.startPage) {
			//if the page that we are on is a valid route we can show that page
			this.startPage = du.extend({}, this.startPage);
			this.startPage.params = du.extend(this.startPage.params, Arg.all());
			this.trigger(this.startPage.destination, this.startPage.params);
		} else {
			//otherwise we've navigated somewhere that delivered the application but isn't
			//a valid route, navigate to the defaultRoute.
			this.navigate(this.options.defaultRoute[0], this.options.defaultRoute[1]);
		}
	},

	/**
	 * Ideally this is relatively unused. The navigate method could just handle whether something is a refresh or a
	 * navigation change, but History.js doesn't fire a statechange if it's just a refresh so we need some way to 
	 * invoke the filter manager. This can also be useful for UI state transitions which want to take advantage of
	 * filter functionality without changing the URL.
	 * @param name
	 * @param params
	 */
	trigger: function (name, params) {
		this.filterManager.process({ destination: name, params: params });
	},
	updateContent: function (html) {
		var $pageContent = $(this.PAGE_CONTENT_SELECTOR);
		//@todo remove this comment when after createing a filter that removes these in UM.
		//$pageContent.children().not('.' + root.UMFlashMessage.messageClass).remove();
		return $pageContent.append(html);
	}
};

Doppelganger.RouteHandlers = {};
Doppelganger.setRouteHandler = du.getterSetterCreator('RouteHandlers');
Doppelganger.getRouteHandler = du.getterSetterCreator('RouteHandlers');

Doppelganger.FilterHandlers = {};
Doppelganger.setFilterHandler = du.getterSetterCreator('FilterHandlers');
Doppelganger.getFilterHandler = du.getterSetterCreator('FilterHandlers');

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
		return this.router.recognize(fullUrl);
	},
	generate: function (name, params) {
		//because Sherpa mutates params we hand it a copy instead.
		return this.router.generate(name, du.extend({}, params));
	},
	trigger: function(destination, routeData) {
		return Doppelganger.getRouteHandler(destination).call(this.app, routeData);
	}
};
//iterator is stored here in order to provide safe mutation of filters (add/remove) during process.
var filterIterator = 0;
Doppelganger.FilterManager = FilterManager = function(app){
	this.filters = [];
	this.app = app;
};
Doppelganger.FilterManager.prototype = {
	add: function(filterArray){
		this.filters = this.filters.concat(filterArray);
	},
    remove: function(filter){
        var idx = du.indexOf(this.filters, filter);
        if (idx !== false) {
            //If remove is called within a filter, maintain safe iteration.
            if (idx < filterIterator) {
                filterIterator = filterIterator - 1;
            }
            this.filters.splice(idx, 1);
        }
    },
    process: function(routeData){
        for (filterIterator = 0; filterIterator < this.filters.length; filterIterator++) {
			var filterName = this.filters[filterIterator];
			routeData = Doppelganger.getFilterHandler(filterName).call(this.app, routeData);
        }
    }
};
//@todo implement routeData
Doppelganger.setFilterHandler('RouterFilter', function(routeData){
	if (!(routeData.destination && routeData.params)) {
		// On initial load, all routerData will be empty.
		// This is a deep extend in order to combine query and path parameters.
		//@todo what was this for?
		//routeData = du.extend(true, routeData, this.startPage);
	}
	
	if (routeData.destination) {
		routeData = du.extend(routeData, this.routeManager.trigger(routeData.destination, routeData));
	}
	
	return routeData;
});

function bindEvents(events) {
	var eventData = [];
	if (!events) {
		return eventData;
	}
	du.each(events, function (callback, eventDescriptor) {
		var chunks = eventDescriptor.split(" "),
			eventNames = chunks[0].split(','),
			selector = chunks.slice(1).join(" "),
			oldCallback = callback,
			elem;
		
		// We need to treat the callback for URL state change differently.
		du.each(eventNames, function(eventName){
			if (eventName === "statechange") {
				elem = window;
				callback = function() {
					var data = History.getState().data.query;
					oldCallback(data);
				};
				du.addEvent(elem, eventName, callback);
			} else {
				elem = document;
				du.addEvent(elem, eventName, selector, callback);
			}
			
			eventData.push({name: eventName, selector: selector, callback: callback, elem: elem});
		});
	});
	return eventData;
}

function unbindEvents(events) {
	if (events.length === 0) {
		return;
	}
	du.each(events, function (eventData) {
		du.removeEvent(eventData.elem, eventData.name, eventData.selector, eventData.callback);
	});
}
//@todo implement a way of initlizing data within filter.
//could continue to use closures but I'm concerned about leaking across files.
var previousEvents = [];
//@todo implement routeData
Doppelganger.setFilterHandler('EventFilter', function(routeData){
	if (!routeData.partial) {
		//Use apply to bind to this some `app` context?
		unbindEvents(previousEvents);
	}
	previousEvents = previousEvents.concat(bindEvents(routeData.events));
	return routeData;
});

})(this);