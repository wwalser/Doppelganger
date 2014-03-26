Doppelgänger
============
Doppelgänger is a small structural framework built with composability in mind. 

Structure
---------
Routers and filters provide structure. Separating code which runs on a single page, routes and code that runs on every page, filters. 

Composability
-------------
Doppelgänger expresses few opinions. It ships with a router, fast event binding/delegation and useful utility functions but all these are easy to completely replace. The only pieces core to Doppelgänger are routers and filters.

Routes and Filters
------------------
Routes and filters will feel natural to anyone who has used almost any server side web framework. Routes usually map 1 to 1 with URLs in your application. A filter chain calls each filter in sequence providing data accumulated by one to the next. 

Non-Core (but super useful)
---------------------------
Doppelgänger provides two filters out of the box, RouterFilter and EventFilter. RouterFilter as you might expect calls routes. Routes are simple callback functions. Usually they draw something in the dom or initialize widgets. Because the filter chain allows data passing between filters, the router filter can return a set of events for the EventFilter to bind. EventFilter event delegation across pages.

Getting Started
---------------
```javascript
var app = Doppelganger.create({
	routes: [name: "index", url:"index.html"],
});
Doppelganger.setRouteHandler('index', function(){
	//display some data
});
app.init();
```

The less important bits
=======================
Building
--------
From the cli:
```
npm install
grunt
```

###Adapter builds
Doppelgänger allows 'adapters' that can be used to slightly reduce the file size if you are already using common libraries. The only adapter currently provided is for jQuery.

In order to build Doppelgänger using an adapter instead of the native code, clone the source and run a grunt build manually.
From the cli:
```
npm install
grunt adapter:jquery
```
This will generate a version of the full Doppelgänger source code inside the dist directory. Select the appropirate file for your needs.

Release History
---------------
0.3.0 - All builtin filters work, all pieces connected, tests.

License
-------
Copyright (c) 2014 Atlassian
Licensed under the Apache 2.0.
