#!/usr/bin/env node

var fs  = require("fs")
,   pth = require("path")
,   exec = require("child_process").exec
,   wrench = require("wrench")
,   request = require("request")
,   jsdom = require("jsdom")
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
    ,   valid = "http://validator.w3.org/check?uri=" + encodeURIComponent(url)
    // ,   css = "http://jigsaw.w3.org/css-validator/validator?profile=css3&output=json&uri=" + encodeURIComponent(url)
    ,   css = "http://jigsaw.w3.org/css-validator/validator?profile=css3&output=ucn&uri=" + encodeURIComponent(url)
    ;
    
    // html validation
    request({ url: valid, method: "HEAD"}, function (err, resp, body) {
        if (err) return console.log(err);
        if (resp.headers["x-w3c-validator-errors"] !== "0") console.log("Error, check " + valid);
        else console.log("\tHTML OK!");
        
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
            
            jsdom.env(
                pth.join(hbDir, file)
            ,   ["http://ajax.googleapis.com/ajax/libs/jquery/1.7.1/jquery.min.js"]
            ,   function (err, window) {
                    if (err) return console.log(err);
                    var $ = window.$;
                    // - right stylesheet (for the given release type)
                    // - stylesheet last (of linked styles)
                    var css = $("link[href='http://www.w3.org/StyleSheets/TR/W3C-WD']");
                    if (!css.length) console.log("No WD style");
                    if (css.nextAll("link[rel=stylesheet]").length) console.log("Stylesheets following primary one");
                    // - IDs on headers
                    $("h1, h2, h3, h4, h5, h6").each(function () {
                        var $h = $(this);
                        if ($h.attr("id")) return;
                        if ($h.parent().attr("id")) return;
                        console.log("Missing and ID on " + $h.text());
                        // normally there can also be <a name> but we can safely ignore that
                    });
                    var $head = $(".head");
                    // - logo
                    var $a = $head.find("a[href='http://www.w3.org/']");
                    if (!$a.length) console.log("Missing header logo link");
                    if (!$a.find("img[src='http://www.w3.org/Icons/w3c_home']").length) console.log("Missing logo");
                    // - h1 title and "W3C Working Draft 29 March 2012" in .head
                    if (!$head.find("h1")) console.log("Missing h1");
                    if (!/W3C Working Draft \d\d \w+ \d{4}/.test($head.find("h2").last().text())) console.log("Missing status and date");
                    pubrules();
                }
            );
        });
        
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
