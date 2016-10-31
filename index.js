'use strict';

var gutil     = require('gulp-util');
var through   = require('through2');
var path = require('path');
var PluginError = gutil.PluginError;
var File = gutil.File;

var pegjs     = require('pegjs');

// Consts
const PLUGIN_NAME = 'gulp-codeverse-pegjs';

module.exports = function (fileName) {
  var grammarSource = [];
  var headerSource;
  var combinedFile;
  var latestFile;

  var processContents = function(file, enc, cb) {

    if (file.isNull()) {
      // return empty file
      return cb(null, file);
    }
    // we don't handle streams
    else if (file.isStream()) {
      throw new PluginError(PLUGIN_NAME, 'Streams not supported');
    }
    //
    else if (file.isBuffer()) {
      let baseName = path.basename(file.path);
      let extension = baseName.split('.')[1];
      // .peg files are grammar
      if (extension === 'peg') {
        grammarSource.push(file.contents.toString());
      }
      // the .js file is the header
      else if (extension === 'js') {
        headerSource = file.contents.toString();
      }
      else {
        throw new PluginError(PLUGIN_NAME, 'Unsupported file ' + baseName);
      }
    }
    //
    else {
      throw new PluginError(PLUGIN_NAME, 'Unknown file process');
    }

    // keep track of the latest file
    latestFile = file;

    cb();

  };

  var endStream = function(cb) {

    // clone everything except contents from the latest file to ensure valid path
    var combinedFile = latestFile.clone({contents: false});
    combinedFile.path = path.join(latestFile.base, fileName);

    // combine the source, note the extra line break is required to pick up the first rule below
    var combinedSource = '\n' + grammarSource.join('\n');

    // get a list of all the rules from the combinedSource
    let allRuleNames = combinedSource.match(/\n([A-Za-z0-9_-])+[\r\n ]*\=/g).map((match) => {
      return match.replace(/[\r\n =]/g, '');
    });

    // add the javascript header to the front of the file;
    combinedSource = headerSource + '\n' + combinedSource;

    // create the peg parser
    let compiledParserSource = pegjs.generate(combinedSource, {
      allowedStartRules: allRuleNames,
      output: 'source',
      trace: false
    });

    // finalize the source to make it importable and not linted
    compiledParserSource = '// jscs:disable\nexport default ' + compiledParserSource + ';'

    // populate the new file with the compiled peg parser
    var fileContents = new Buffer(compiledParserSource);
    combinedFile.contents = fileContents;

    // add this new file
    this.push(combinedFile);
    cb();
  };

  return through.obj(processContents, endStream);
};
