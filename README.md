# gulp-kidscript-pegjs

This gulp plugin will generate a pegjs parser based on various opinions around how our grammer is written and organized

## example usage
```JavaScript
// gulpfile.babel.js

import pegjs from 'gulp-kidscript-pegjs';

function buildParser() {
  /*
    switch print to true to output the combined grammar, this 
    is useful for testing on the interactive tool on their website
    
    trace can be true or false to generate a parser which supports tracing
  */ 
  let tracer = null;
  let options = {
    print: false,
    trace: false
  };
  return gulp.src(['grammar/header.js', 'grammar/index.peg', 'grammar/**/*.peg'])
    .pipe(pegjs('peg_parser.js', options))
    .pipe(gulp.dest('./src/parser'));
};

// generate the combined grammer, and build the parser
gulp.task('build-parser', buildParser);
```
