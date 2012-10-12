#!/usr/bin/env node

var fs  = require("fs")
,   pth = require("path")
,   exec = require("child_process").exec
,   request = require("request")
,   libxmljs = require("libxmljs")
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
    // ,   css = "http://jigsaw.w3.org/css-validator/validator?profile=css3&output=json&uri=" + encodeURIComponent(url)
    ,   css = "http://jigsaw.w3.org/css-validator/validator?profile=css3&output=ucn&uri=" + encodeURIComponent(url)
    ;
    
    // css validation
    request({ url: css, method: "GET"}, function (err, resp, body) {
        if (err) return console.log(err);
        // XXX this works, but it gives no details and so we can't ignore errors
        // var res = JSON.parse(body);
        // if (!res.validity) console.log("Error, check " + css);
        // else console.log("\tCSS OK!");
        var doc = libxmljs.parseXml(body)
        ,   errors = doc.find("//message[@type='error']")
        ,   errCount = 0
        ;
        for (var i = 0, n = errors.length; i < n; i++) {
            var node = errors[i]
            ,   txt = node.text()
            ;
            if (/leader/.test(txt)) continue;
            errCount++;
        }
        if (errCount) console.log("Error, check " + css);
        else console.log("\tCSS OK!");
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
