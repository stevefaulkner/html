#!/usr/bin/env node

var fs  = require("fs")
,   pth = require("path")
,   exec = require("child_process").exec
,   wrench = require("wrench")
;

// where are we?
var rootDir = pth.join(__dirname, "..")
,   hbDir = pth.join(rootDir, "heartbeat")
;

// rsync to http://berjon.com/TR/html5/
exec(   "rsync -avze ssh /Projects/html/html/heartbeat/ darobin@$POING:/var/www/sites/berjon.com/htdocs/TR/html5/"
    ,   { cwd: hbDir }
    ,   function (err, stdout, stderr) {
            console.log(stdout);
            console.log(stderr);
            if (err) throw err;
            // pubrules
            // check, check, check
            var files = fs.readdirSync(hbDir);
            console.log("Checking " + files.length + " files");
});
