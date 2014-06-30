'use strict';

var gulp        = require('gulp'),
    jshint      = require('gulp-jshint'),
    stylish     = require('jshint-stylish'),
    bowerSrc    = require('gulp-bower-src'),
    concat      = require('gulp-concat'),
    less        = require('gulp-less'),
    ngmin       = require('gulp-ngmin'),
    minifyCSS   = require('gulp-minify-css'),
    uglify      = require('gulp-uglify'),
    rename      = require('gulp-rename'),
    clean       = require('gulp-clean'),
    browserSync = require('browser-sync'),
    nodemon     = require('gulp-nodemon'),
    reload      = browserSync.reload;

/*******************************************************************************
 1. CONFIG
 *******************************************************************************/
process.env.NODE_ENV = 'development';
var config = require('./config/config'),
    applicationJavaScriptFiles  = config.assets.js,
    watchFiles = {
        serverViews: ['app/views/**/*.*'],
        serverJS: ['gulpfile.js', 'app.js', 'config/**/*.js', 'app/**/*.js'],
        clientViews: ['public/modules/**/views/*.html'],
        clientJS: ['public/js/*.js', 'public/modules/**/*.js'],
        clientCSS: ['public/modules/**/*.less']
    };

/*******************************************************************************
 1. LESS TASKS
 *******************************************************************************/
gulp.task('compile-less', function() {
    return gulp.src('./public/application.less')
        .pipe(less())
        .pipe(gulp.dest('./public/dist/'))
        .pipe(reload({stream:true}));
});

gulp.task('minify-css', function() {
    return gulp.src('./public/dist/application.css')
        .pipe(minifyCSS({keepBreaks:true}))
        .pipe(rename({ suffix: '.min' }))
        .pipe(gulp.dest('./public/dist/'));
});

/*******************************************************************************
 1. JS TASKS
 *******************************************************************************/
gulp.task('lint-js', function() {
    return gulp.src(watchFiles.clientJS.concat(watchFiles.serverJS))
        .pipe(jshint())
        .pipe(jshint.reporter(stylish));
});

gulp.task('minify-js', function() {
    return gulp.src(applicationJavaScriptFiles)
        .pipe(concat('application.js'))
        .pipe(ngmin())
        .pipe(gulp.dest('./public/dist/'));
});

gulp.task('uglify-js', function() {
    return gulp.src('./public/dist/application.js')
        .pipe(uglify({mangle:false}))
        .pipe(rename({ suffix: '.min' }))
        .pipe(gulp.dest('./public/dist/'));
});


/*******************************************************************************
 1. BOWER INSTALL
 *******************************************************************************/
gulp.task('remove-lib-folder', function () {
    return gulp.src('public/lib', {read: false}).pipe(clean());
});

gulp.task('move-bower', function() {
    return bowerSrc().pipe(gulp.dest('public/lib'));
});

/*******************************************************************************
 1. SERVER TASK
 *******************************************************************************/
// ---- Nodemon watching backend files
gulp.task('nodemon', function (cb) {
    var called = false;
    return nodemon({
        script: 'app.js',
        watch: watchFiles.serverJS
    }).on('start', function () {
        if (!called) {
            // To avoid "task completion called too many times"
            called = true;
            cb();
        }
    });
});

// ---- Browser-sync
gulp.task('browser-sync', ['nodemon'], function() {
    // Set timeout to wait for Express app to load
    setTimeout(function(){
        browserSync.init(null, {
            proxy: 'http://localhost:3000'
        });
    }, 3000);
});

// ---- Browser-sync reload page
gulp.task('bs-reload', function() {
    return browserSync.reload();
});

/*******************************************************************************
 1. GULP TASKS
 *******************************************************************************/

/**
 * - gulp install: Move files from Bower directory to lib folder
 * - gulp: ...
 * - gulp serve: LintJS, CompileLess, Start Server, Sync and watch
 * - gulp build: Make production files
 */

gulp.task('install', ['remove-lib-folder', 'move-bower']);

gulp.task('default', ['lint-js', 'compile-less']);

gulp.task('serve', ['lint-js', 'compile-less', 'browser-sync'], function() {
    gulp.watch(watchFiles.clientCSS, ['compile-less']);
    gulp.watch(watchFiles.clientJS, ['lint-js', 'bs-reload']);
    gulp.watch(watchFiles.clientViews.concat(watchFiles.serverViews), ['bs-reload']);
});

gulp.task('build', ['lint-js', 'compile-less', 'minify-css','minify-js', 'uglify-js']);