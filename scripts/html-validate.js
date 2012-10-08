#!/usr/bin/env node

var fs  = require("fs")
,   pth = require("path")
,   exec = require("child_process").exec
,   request = require("request")
;

// where are we?
var rootDir = pth.join(__dirname, "..")
,   hbDir = pth.join(rootDir, "heartbeat")
,   files
,   total = 0
;

function pubrules () {
    if (files.length === 0) return;
    var file = files.shift();
    console.log("Processing " + file + ", " + (total - files.length) + "/" + total);
    if (!/\.html$/.test(file)) return pubrules();
    
    // validate HTML
    var url = "http://berjon.com/TR/html5/" + file
    ,   valid = "http://validator.w3.org/check?uri=" + encodeURIComponent(url)
    ;
    
    // html validation
    request({ url: valid, method: "HEAD"}, function (err, resp, body) {
        if (err) return console.log(err);
        if (resp.headers["x-w3c-validator-errors"] !== "0") console.log("Error, check " + valid);
        else console.log("\tHTML OK!");
        pubrules();
    });
}

// rsync to http://berjon.com/TR/html5/
exec(   "rsync -avze ssh /Projects/html/html/heartbeat/ darobin@$POING:/var/www/sites/berjon.com/htdocs/TR/html5/"
    ,   { cwd: hbDir }
    ,   function (err, stdout, stderr) {
            console.log(stdout);
            console.log(stderr);
            if (err) throw err;
            // pubrules
            // check, check, check
            files = fs.readdirSync(hbDir);
            total = files.length;
            console.log("Checking " + total + " files");
            pubrules();
});
