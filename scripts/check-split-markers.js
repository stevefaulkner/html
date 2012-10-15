#!/usr/bin/env node

var fs = require("fs")
,   pth = require("path")
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
                if (status === seen[key]) console.log("Consecutive " + status + " for " + key + " at " + offset + " line " + line);
            }
            else {
                if (status === "END") console.log("First occurrence of " + key + " is END");
            }
            seen[key] = status;
        }
        return match;
    })
;

