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
More to come here. Will eventually support two alternative build. One with util adapters for jQuery and another for core only code.

Release History
---------------
0.3.0 - All builtin filters work, all pieces connected, tests.

License
-------
Copyright (c) 2014 Wesley Walser
Licensed under the MIT license.
