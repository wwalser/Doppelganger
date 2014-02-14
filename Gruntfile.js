'use strict';

module.exports = function(grunt) {
	var defaultTasks = [
		'concat:dist',
		'jshint',
		'qunit',
		'uglify:dist', 
		'concat:withDeps', 
		'uglify:withDeps'];

	// Project configuration.
	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
		qunit: {
			all: ['test/**/*.html'],
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
		concat: {
			options: {
				banner: '<%= banner %>',
				stripBanners: true
			},
			dist: {
				src: ['lib/intro.js', 
					'lib/util.js',
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
				banner: '<%= banner %>'
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
				tasks: defaultTasks
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
	grunt.registerTask('default', defaultTasks);
	
};
