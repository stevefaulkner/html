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

// rsync to http://berjon.com/TR/html5/
// run pubrules on every document in there, with the right options

