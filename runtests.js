
var jasmine = require('jasmine-node');
var $q = require('q');
    jasmine.executeSpecsInFolder({
    specFolders: [__dirname+'/tests'],
    isVerbose: true,
    showColors: true,
    captureExceptions: true
});