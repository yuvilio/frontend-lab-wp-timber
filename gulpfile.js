

//watch a fileb
//when it's new, open browser . when it's updated browsersync


var gulp = require('gulp');
var gutil = require('gulp-util');
var browserSync = require('browser-sync');
var browserify = require('browserify');
var watchify = require('watchify');
var minimist = require('minimist');
var sass = require('gulp-ruby-sass');
var vss = require('vinyl-source-stream');
var path = require('path');
var open = require('open');
var swig = require('gulp-swig'); //render swig templates
var gdata = require('gulp-data'); //pass data via streams
var rename = require('gulp-rename');
var hexofs = require('hexo-fs'); //promise friendly fs functions
var autoprefixer = require('gulp-autoprefixer');
var execc  = require('exec-chainable');
var multiline = require('multiline');

//parse command line options
var knownOptions = {
  string: ['name', 'batch'], //ex.: --batch svg-shapes --name svg-001-test --port 4263

  //for each item, if theyh didn't pass an option, we'll default to one of these
  default: {
    name: 'ct-' + (new Date()).getTime(), //a unique name
    batch: 'batch-001',  //the default batch
    port: 4286,
    host: "blog.timbertest.dev"
  }
};
var options = minimist(process.argv.slice(2), knownOptions);

//conveniences

var labPath =  './lab/' + options.batch + '/'+ options.name;
var distPath = './dist/' + options.batch + '/'+ options.name;

//path to this theme, relative to the wp-root
var themePath = 'wp-content/themes/timbertest';

// ex: $ gulp init --batch svg-shapes --name svg-001-test
gulp.task('init', function(){
  // console.log('labPath', labPath);
  // console.log('distPath', distPath);

  // hexofs.mkdirs( distPath + '/img/' );
  // //
  var swigopts  = {
    defaults: {
      cache: false
    }
  };

  var context = {
    themePath: themePath,
    name: options.name,
    batch: options.batch
  };
  //

  //
  //
  //
  gulp.src('./templates/scss/styles.scss.swig')
  .pipe(gdata(context))
  .pipe(swig(swigopts))
  .pipe(rename('styles.scss')) //when not generating html, need to rename output
  .pipe(gulp.dest( labPath + '/sass/'));

  //
  gulp.src('./templates/js/source.js.swig')
  .pipe(gdata(context))
  .pipe(swig(swigopts))
  .pipe(rename('source.js'))
  .pipe(gulp.dest( labPath + '/js/'));




  var postId, postName;

  execc('wp post create --post_type=page --post_title="'+options.batch+'-'+options.name+'" --post_status=publish ')
  // execc('echo ')
  .then(function (stdout) {

    postId = stdout.trim().match(/([0-9]+)/)[0];

    console.log(postId)

    return execc('wp post get '+postId+' --field="post_name"' );
  })
  .then(function(stdout){
    postName = stdout.trim();

    console.log('created post with postname "%s" and id "%d"' , postName, postId)
    console.log('php code to paste to page.php: ');
    console.log(multiline(function(){/*
      if ($post->ID == %d OR $post->post_name == "%s") {
        Timber::render( '%s.twig', $data );
      }
      */}), postId, postName, labPath + '/views/' + postName);

  })
  .done(function (stdout) {

    //initial twig template (ironically templated by swig)
    gulp.src('./templates/index.swig')
    .pipe(gdata(context))
    .pipe(swig(swigopts))
    .pipe(rename(postName + '.twig'))
    .pipe(gulp.dest( labPath + '/views/' ));


    console.log('initializing done.\n To monitor, run command "%s"\nTo change, edit the files files at  %s.  ', 'gulp browserSync --batch ' + options.batch + ' --name ' + options.name, labPath);

  });



});
//
// });




//  watch the js with watchify and if it changes rebuild, refresh browser
// browserify bundle js (and watch for future changes to trigger it again)
gulp.task('watchify', function(){

  //mostly similary to the watchify task right above with one addition
  var bundleShare = function(b) {

   return b.bundle() //recall b (the watchify/browserify object alreadyknows the source files). carry out the bundling
     .on("error", function(err) {
       console.log("Browserify error:", err);
     })
     .pipe(vss( distPath + '/js/source.js'))
     .pipe(gulp.dest('./'))
     //after you're done bundling, inform browserSync to reload the page
     .pipe(browserSync.reload({stream:true, once: true}));
  };

  var b = browserify({
    cache: {},
    packageCache: {},
    fullPaths: true
  });

  //files we'll bundle and watch for changes to trigger bundling
  b.add(labPath + '/js/source.js');
  // b.add(labPath + '/index.nunj');


  //wrap
  b = watchify(b);

  //whenever a file we're bundling is updated
   b.on('update', function(paths){
     //give some sort of gulp indication that a save occured on one of the watched files
     console.log('watchify rebundling: ', paths);
    bundleShare(b); //browserify away
  });

  // b.on('error', function (error) { // Catch any js errors and prevent them from crashing gulp
  //   console.error(error);
  //   this.emit('end');
  // })

  //while we're here let's do a one time browserify bundling
  bundleShare(b);

});

//compile sass -> css
gulp.task('sass', function() {
  return gulp.src(labPath + '/sass/styles.scss')
    .pipe(sass({
      //disabling sourmaps for now fir gulp-ruby-sass work with gulp-autoprefixer
      //see http://stackoverflow.com/questions/26979433/gulp-with-gulp-ruby-sass-error-style-css-map31-unknown-word
      "sourcemap=none": true,

      //have some more stylesheets you may want to use? Add them here
      "loadPath" : ['assets/scss']
    }))
    .on('error', function (error) { // Catch any SCSS errors and prevent them from crashing gulp
      console.error(error);
      this.emit('end');
    })
    .pipe(autoprefixer({
      browsers: ['last 2 versions'],
      cascade: false
    }))
    .pipe(gulp.dest(distPath + '/css'))
    .pipe(browserSync.reload({ stream:true, once: true }));
});


//watching non-specialized files (like sas changes)
gulp.task('watch', function(){
    //when the scss changes, run gulp-sass task
    gulp.watch(labPath + '/sass/styles.scss', ['sass']);



})

//we'll kick off watchify which will take care of the bundling and inform us
// ex: $ gulp browserSync --batch svg-pocket-guide --name svg-001-test
gulp.task('browserSync', ['watchify', 'watch'], function() {
  // console.log('trig paths', labPath + '/views/**/*.swig')
  browserSync(
    {
    proxy: { //let your server be the front face
      proxy: options.host
    },
    port: options.port, //meanwhile browserSync will serve at this port
    // browserSync will have some watching duties as well for twig templates
    files: [ labPath + '/views/**/*.twig' ]
  });

  console.log('serving at http://%s/%s', options.host, options.batch + '-' + options.name)

});




gulp.task('shell-test', function(){


  execc('echo 1').then(function (stdout) {
    console.log(stdout);
    //=> 1
    return execc('echo 2');
  }).done(function (stdout) {
    console.log(stdout);
    //=> 2
  });
})
