/* jshint node: true */

module.exports = function (grunt) {
  "use strict";

  grunt.initConfig({
      pkg: grunt.file.readJSON('package.json')
    , jshint: {
        all: [
            "Gruntfile.js"
          , "static/figure/js/app.js"
          , "static/figure/js/models/*.js"
          , "static/figure/js/views/*.js"
        ]
      , options: {
          jshintrc: '.jshintrc'
        },
      }
    , jasmine: {
        src: [
            "static/figure/3rdparty/jquery-1.7.2.js",
            "static/figure/3rdparty/underscore.js",
            "static/figure/3rdparty/backbone.js",
            "static/figure/js/*.js"
        ]
      , options: {
          specs: "spec/*.js"
        // , vendor: "vendor/**/*.js"
      }
    },
    jst: {
      compile: {
        files: {
          "static/figure/js/templates.js": [
            "static/figure/templates/*.html",
            "static/figure/templates/**/*.html"
          ]
        }
      }
    },
    watch: {
      scripts: {
        files: ['static/figure/templates/*.html', 'static/figure/templates/**/*.html'],
        tasks: ['jst'],
        // options: {
        //   spawn: false,
        // },
      },
    },
    concat: {
      js: {
        src: ['static/figure/js/models/*.js', 'static/figure/js/views/*.js', 'static/figure/js/app.js'],
        dest: 'static/figure/js/figure.js',
      },
    },
  })

  grunt.loadNpmTasks('grunt-contrib-jshint')
  grunt.loadNpmTasks('grunt-contrib-jasmine')
  grunt.loadNpmTasks('grunt-contrib-jst');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-concat');

  grunt.registerTask('test', ['jasmine'])
  grunt.registerTask('default', ['jshint'])
};
