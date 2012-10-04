#!/usr/bin/env node

var fs  = require("fs")
,   pth = require("path")
,   exec = require("child_process").exec
,   wrench = require("wrench")
;

// basic setup
var rootDir = pth.join(__dirname, "..")
,   hbDir = pth.join(rootDir, "heartbeat")
;
if (fs.existsSync(hbDir)) wrench.rmdirSyncRecursive(hbDir);
fs.mkdirSync(hbDir);

// build the spec
exec("make html", { cwd: rootDir }, function (err, stdout, stderr) {
    console.log(stdout);
    console.log(stderr);
    if (err) throw err;
    wrench.copyDirSyncRecursive(pth.join(rootDir, "output/html/"), hbDir);
    fs.renameSync(pth.join(hbDir, "spec.html"), pth.join(hbDir, "index.html"));
    // in every single file in there, replace spec.html with index.html
    var files = fs.readdirSync(hbDir);
    for (var i = 0, n = files.length; i < n; i++) {
        var file = pth.join(hbDir, files[i]);
        if (!file.match(/\.html$/)) continue;
        var content = fs.readFileSync(file, "utf-8");
        content = content.replace(/\bspec\.html\b/g, "index.html");
        fs.writeFileSync(file, content, "utf-8");
    }
    // copy the images
    var imgDir = pth.join(hbDir, "images");
    fs.mkdirSync(imgDir);
    wrench.copyDirSyncRecursive(pth.join(rootDir, "images/"), imgDir);
    console.log([   "The specification has been generated. You may now wish to:"
                ,   "\t\u2022 Run the link checker on everything (link-checker.js)"
                ,   "\t\u2022 Run pubrules on everything (pubrules.js)"
                 ].join("\n"));
});
