#!/usr/bin/env node

var fs = require('fs')
   ,program = require('commander')
   ,cheerio = require('cheerio')
   ,rest = require('restler');
var HTMLFILE_DEFAULT = "index.html";
var CHECKSFILE_DEFAULT = "checks.json";

var assertFileExists = function(infile) {
    var instr = infile.toString();
    if(!fs.existsSync(instr)) {
        console.log("%s does not exist. Exiting.", instr);
        process.exit(1); // http://nodejs.org/api/process.html#process_process_exit_code
    }
    return instr;
};


var checkHtmlUrl = function(url, checksfile) {
    console.log("Fetching HTML from %s", url);
	rest.get(url)
		.on('fail', function(result) {
			console.log("Resource not found at %s", url);
		 })
		 .on('error', function(err) {
		    console.log("Error connecting to %s", url);
		 })
		 .on('success', function(result) {
		 	var outJson = JSON.stringify(checkHtmlFile(result, checksfile),null,4);
		 	console.log(outJson);
		 });
};

var cheerioHtmlFile = function(htmlfile) {
    return cheerio.load(htmlfile);
};

var loadChecks = function(checksfile) {
    return JSON.parse(fs.readFileSync(checksfile));
};

var checkHtmlFile = function(htmlfile, checksfile) {
    $ = cheerioHtmlFile(htmlfile);
    var checks = loadChecks(checksfile).sort();
    var out = {};
    for(var i in checks) {
        var present = $(checks[i]).length > 0;
        out[checks[i]] = present;
    }
    return out;
};

var clone = function(fn) {
    return fn.bind({});
};

if(require.main == module) {
    program
        .option('-c, --checks <check_file>', 'Path to checks.json', clone(assertFileExists), CHECKSFILE_DEFAULT)
        .option('-f, --file <html_file>', 'Path to HTML file', clone(assertFileExists), HTMLFILE_DEFAULT)
        .option('-u, --url <url>','URL to be checked')        
        .parse(process.argv);
    
    var checkJson;
    if(program.url) {
    	checkHtmlUrl(program.url, program.checks);
    } else if(program.file){
        console.log("Reading from file %s", program.file); 
    	checkJson = checkHtmlFile(fs.readFileSync(program.file), program.checks);
    	var outJson = JSON.stringify(checkJson, null, 4);
    	console.log(outJson);
    }
    
} else {
    exports.checkHtmlFile = checkHtmlFile;
    exports.checkHtmlUrl = checkHtmlUrl;	
}
