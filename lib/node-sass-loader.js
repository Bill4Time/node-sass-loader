// TODO: Configure node-sass-loader to provide the options to configure node-sass
// Core Libraries
var fs = require('fs');
var path = require('path');

// Third-Party Libraries
var _ = require('lodash');
var nodeSass = require('node-sass');
var wrench = require('wrench');

// Custom Libraries
var fsHelper = require('fs-helper');

/** compile
        This is the call that will trigger compilation of SASS files to CSS files.
 * @param  { Object } options                       [ This is a container object for the options to run the node-sass compilation with. ]
 * @param  { String } options.source_directory      [ This is the source directory that the sass files are located in. ]
 * @param  { String } options.destination_directory [ This is the destination directory that the css files will be copied into. ]
 * @return { undefined }                            [ This returns nothing. ]
 */
var compile = function compile(options) {
    if (_.isNull(options) || _.isUndefined(options)) {
        throw ReferenceError('You MUST provide options to the "compile" function in order for it to work.');
    }

    // Required options
    validateDirectory(options.source_directory);
    validateDirectory(options.destination_directory);

    // Default options
    options.output_extension = options.output_extension || 'css';
    options.extensions = options.extensions || ['scss'];

    console.log('Compiling SASS files to CSS');
    console.log('SASS Directory:\n\t' + options.source_directory);
    console.log('CSS Directory:\n\t' + options.destination_directory + '\n');
    if (!fs.existsSync(options.source_directory)) {
        throw ReferenceError('The "source_directory" provided for compiling SASS does not exist. Please verify that the correct directory is being pointed to.');
    }

    compileDirectories(options);
};

/** compileDirectories 
 *      This will recursively iterate through directories in the source directory folder, and will compile each out to the destination directory, maintaining the relative path from the first source directory so that the destination directory's heirarchy matches the source directory.
 * @param  { Object } options                           [ This is the containing object for the compile options. ]
 * @param  { String } options.source_directory          [ This is the source directory to compile directories from. ]
 * @param  { String } options.destination_directory     [ This is the destination directory to compile directores from. ]
 * @param  { Array of String } options.output_extension [ This is the extension of the compiled file. ]
 * @param  { Array of String } options.extensions       [ These are the extensions to compile. ]
 * @return { undefined }                                [ This returns nothing. ]
 */
var compileDirectories = function compileDirectories(options) {
    subdirectory_paths = fsHelper.getDirPathsSync(options.source_directory);

    compileDirectory(options);

    _.map(subdirectory_paths, function(subdirectory_path) {
        var subdirectory_basename = path.basename(subdirectory_path);
        var new_destination_directory = path.join(options.destination_directory, subdirectory_basename);

        var new_options = _.extend({}, options, {
            source_directory: subdirectory_path,
            destination_directory: new_destination_directory
        });
        compileDirectories(new_options);
    });
};

/** compileDirectory
 *      This will iterate over the files in the source directory and using node-sass, will compile them to the output files. It will output them to the destination directory, with the output extension appended to each file.
 * @param  { Object } options                           [ This is the containing object for the compile options. ]
 * @param  { String } options.source_directory          [ This is the source directory to compile directories from. ]
 * @param  { String } options.destination_directory     [ This is the destination directory to compile directores from. ]
 * @param  { Array of String } options.output_extension [ This is the extension of the compiled file. ]
 * @param  { Array of String } options.extensions       [ These are the extensions to compile. ]
 * @return { undefined }                                [ This returns nothing. ]
 */
var compileDirectory = function compileDirectory(options) {
    var files = fsHelper.getFilePathsByExtensionSync(options.source_directory, options.extensions);

    _.map(files, function(file) {
        var full_file_name = path.basename(file);
        var file_extension = path.extname(file);
        var file_name = full_file_name.slice(0, -file_extension.length);
        var output_file_name = file_name + '.' + options.output_extension;

        var destination_filepath = path.join(options.destination_directory, output_file_name);
        var stats = {};

        console.log('compiling source file:\n\t' + file);
        console.log('    to destination file:\n\t' + destination_filepath);

        var rendered_object = nodeSass.renderSync({
            file: file,
            includePaths: (!_.isNull(options.include_paths) && !_.isUndefined(options.include_paths)) ? options.include_paths : [],
            outputStyle: 'nested',
            stats: stats
        });

        wrench.mkdirSyncRecursive(options.destination_directory, 0755);
        fs.writeFileSync(destination_filepath, rendered_object.css, { /* TODO: provide hook-in for options */ });
    });
};

/** validateDirectory
 *      A simple validation to make sure the directory passed in is a string, as well as not null or undefined.
 * @param  { String }       [ The directory to validate. ]
 * @return { undefined }    [ This returns nothing. ]
 */
var validateDirectory = function validateDirectory(directory) {
    if (!directory) {
        throw ReferenceError('The directory provided is "null" or "undefined". A value must be passed to the node-sass-loader in order for SASS compilation to work.');
    }
    if (!_.isString(directory)) {
        throw TypeError('The directory MUST be a type of  "String".');
    }
};

var node_sass_loader = {
    compile: compile,
};

module.exports = node_sass_loader;
