#!/usr/bin/env node
/*
 Automatically grade files for the presence of specified HTML tags/attributes.
 Uses commander.js and cheerio. Teaches command line application development
 and basic DOM parsing.

 References:

 + cheerio
 - https://github.com/MatthewMueller/cheerio
 - http://encosia.com/cheerio-faster-windows-friendly-alternative-jsdom/
 - http://maxogden.com/scraping-with-node.html

 + commander.js
 - https://github.com/visionmedia/commander.js
 - http://tjholowaychuk.com/post/9103188408/commander-js-nodejs-command-line-interfaces-made-easy

 + JSON
 - http://en.wikipedia.org/wiki/JSON
 - https://developer.mozilla.org/en-US/docs/JSON
 - https://developer.mozilla.org/en-US/docs/JSON#JSON_in_Firefox_2
 */

var fs = require('fs');
var http = require('http');
var program = require('commander');
var cheerio = require('cheerio');
var url = require('url');
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

var assertValidUrl = function (url){
    //Did not get the other regexp syntax working
    var regex =  "\\b(https?|ftp|file)://[-A-Za-z0-9+&@#/%?=~_|!:,.;]*[-A-Za-z0-9+&@#/%=~_|]";
    var result = url.match(new RegExp(regex));
    console.log((result != null) + " " + url);

    if(result == null) {
        console.log("%s is not a valid URL. Exiting.", url);
        process.exit(1); // http://nodejs.org/api/process.html#process_process_exit_code
    }
    return url;
}

var cheerioHtmlFile = function(htmlfile) {
    return cheerio.load(fs.readFileSync(htmlfile));
};

var cheerioHtmlUrl = function(urlstr, cb) {
    var urlobj = url.parse(urlstr);

    var options = {
        host: urlobj.host,
        port: urlobj.port,
        path: urlobj.path,
        method: 'GET'
    };

    var req = http.request(options, function(res) {
        var output = '';
        console.log('STATUS: ' + res.statusCode);
        console.log('HEADERS: ' + JSON.stringify(res.headers));
        res.setEncoding('utf8');

        res.on('data', function (chunk) {
            console.log('BODY: ' + chunk);
            output += chunk;
        });
        res.on('end', function() {
            cb(cheerio.load(output));
        });
    });

    req.on('error', function(e) {
        console.log('problem with request: ' + e.message);
    });

    req.end();
};

var loadChecks = function(checksfile) {
    return JSON.parse(fs.readFileSync(checksfile));
};

var checkHtmlFile = function(htmlfile, checksfile) {
    $ = cheerioHtmlFile(htmlfile);
    var checks = loadChecks(checksfile).sort();
    var out = {};
    for(var ii in checks) {
        var present = $(checks[ii]).length > 0;
        out[checks[ii]] = present;
    }
    return out;
};
var checkHtmlUrl = function(url, checksfile, cb) {
    cheerioHtmlUrl(url, function($){
        var checks = loadChecks(checksfile).sort();
        var out = {};
        for(var ii in checks) {
            var present = $(checks[ii]).length > 0;
            out[checks[ii]] = present;
        }
        cb(out);
    });
};

var clone = function(fn) {
    // Workaround for commander.js issue.
    // http://stackoverflow.com/a/6772648
    return fn.bind({});
};

if(require.main == module) {
    program
        .option('-c, --checks <check_file>', 'Path to checks.json', clone(assertFileExists), CHECKSFILE_DEFAULT)
        .option('-f, --file <html_file>', 'Path to index.html', clone(assertFileExists), HTMLFILE_DEFAULT)
        .option('-u, --url <url>', 'Url to html file', clone(assertValidUrl))
        .parse(process.argv);

    if (program.url !== undefined) {
        checkHtmlUrl(program.url, program.checks, function (checkJson){
            var outJson = JSON.stringify(checkJson, null, 4);
            console.log(outJson);
        });
    }
    else {
        var checkJson = checkHtmlFile(program.file, program.checks);
        var outJson = JSON.stringify(checkJson, null, 4);
        console.log(outJson);
    }


} else {
    exports.checkHtmlFile = checkHtmlFile;
}