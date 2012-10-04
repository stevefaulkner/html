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

// check, check, check
var files = fs.readdirSync(hbDir);
console.log("Checking " + files.length + " files");
for (var i = 0, n = files.length; i < n; i++) {
    var file = files[i];
    console.log("Checking file " + (i + 1) + " of " + files.length + " (" + file + ")");
    if (!file.match(/\.html$/)) continue;
    exec("checklink -s -b -q  " + pth.join(hbDir, file), { cwd: hbDir }, function (err, stdout, stderr) {
        console.log(stdout);
        if (err) throw err;
    });
}
