//'use strict';

module.exports = function(grunt) {
	var banner = "/***************\n" +
		" * Doppelganger\n" +
		" * Copyright Atlassian 2014\n" +
		" * Released under the Apache 2 license. http://www.apache.org/licenses/LICENSE-2.0.html\n" +
		" */\n";
	function mainTasks(adapter) {
		var adapterString = adapter ? ':' + adapter : '';
		var tasks = [
			'concat:dist' + adapterString,
			'jshint',
			'uglify:dist', 
			'concat:withDeps', 
			'uglify:withDeps',
			'qunit:all' + adapterString,
		];
		return tasks;
	}

	// Project configuration.
	grunt.initConfig({
		defaultAdapter: 'native',
		pkg: grunt.file.readJSON('package.json'),
		qunit: {
			all: ['test/doppelganger_<%= grunt.task.current.args[0] || defaultAdapter %>_test.html'],
		},
		jshint: {
			options: {
				jshintrc: '.jshintrc'
			},
			gruntfile: {
				src: 'Gruntfile.js'
			},
			dist: {
				src: ['dist/doppelganger.js']
			},
			test: {
				src: ['test/*.js']
			},
		},
		adapter: {
			jquery: "jquery",
			native: "native"
		},
		concat: {
			options: {
				banner: banner,
				stripBanners: true
			},
			dist: {
				src: ['lib/intro.js',
					'lib/adapter/<%= grunt.task.current.args[0] || defaultAdapter %>.js',
					'lib/main.js', 
					'lib/RouteManager.js',
					'lib/FilterManager.js',
					'lib/filters/RouterFilter.js',
					'lib/filters/EventFilter.js',
					'lib/outro.js'],
				dest: 'dist/doppelganger.js'
			},
			withDeps: {
				src: ['vendor/arg.js.v1.1.js',
					'vendor/native.history.js',
					'vendor/sherpa.js',
					'dist/doppelganger.js'
					],
				dest: 'dist/doppelganger_with_deps.js'
			},
		},
		uglify: {
			options: {
				banner: banner
			},
			dist: {
				src: '<%= concat.dist.dest %>',
				dest: 'dist/doppelganger.min.js'
			},
			withDeps: {
				src: '<%= concat.withDeps.dest %>',
				dest: 'dist/doppelganger_with_deps.min.js'
			},
		},
		watch: {
			gruntfile: {
				files: '<%= jshint.gruntfile.src %>',
				tasks: ['jshint:gruntfile']
			},
			lib: {
				files: ['lib/**/*.js'],
				tasks: mainTasks()
			},
			test: {
				files: '<%= jshint.test.src %>',
				tasks: ['jshint:test', 'qunit']
			},
		},
	});
	
	// These plugins provide necessary tasks.
	grunt.loadNpmTasks('grunt-contrib-qunit');
	grunt.loadNpmTasks('grunt-contrib-jshint');
	grunt.loadNpmTasks('grunt-contrib-watch');
	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-contrib-concat');
	
	// Default task.
	grunt.registerTask('default', mainTasks());
	
	grunt.registerMultiTask('adapter', function(){
		grunt.task.run(mainTasks(this.target));
	});
};
