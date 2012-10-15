#!/usr/bin/env node

var fs = require("fs")
,   pth = require("path")
,   bisect = process.argv[2] === "bisect"
,   seen = {}
,   line = 0
;

fs.readFileSync(pth.join(__dirname, "../source"), "utf8")
    .replace(/(?:<!--(START|END)\s+([-\w]+?)-->|(\n))/g, function (match, status, key, nl, offset) {
        if (nl) {
            line++;
        }
        else {
            if (seen[key]) {
                if (status === seen[key]) {
                    if (bisect) process.exit(1);
                    console.log("Consecutive " + status + " for " + key + " at " + offset + " line " + line);
                }
            }
            else {
                if (status === "END") {
                    if (bisect) process.exit(1);
                    console.log("First occurrence of " + key + " is END");
                }
            }
            seen[key] = status;
        }
        return match;
    })
;

