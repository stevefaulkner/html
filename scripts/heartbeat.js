#!/usr/bin/env node

var fs  = require("fs.extra")
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
    fs.renameSync(pth.join(hbDir, "index.html"), pth.join(hbDir, "section-index.html"));
    fs.renameSync(pth.join(hbDir, "spec.html"), pth.join(hbDir, "index.html"));
    // in every single file in there, replace spec.html with index.html
    var files = fs.readdirSync(hbDir);
    for (var i = 0, n = files.length; i < n; i++) {
        var file = pth.join(hbDir, files[i]);
        if (!file.match(/\.html$/)) continue;
        var content = fs.readFileSync(file, "utf-8");
        // the below looks weird because for reasons beyond human understanding,
        // JS does not support zero-width negative lookbehinds
        content = content
                    .replace(/\bsection-index\.html/g, "REPLACE-ME-SECTION-INDEX")
                    .replace(/\bindex\.html\b/g, "section-index.html")
                    .replace(/REPLACE-ME-SECTION-INDEX/g, "section-index.html")
                    .replace(/\bspec\.html\b/g, "index.html");
        fs.writeFileSync(file, content, "utf-8");
    }
    // copy the images
    var imgDir = pth.join(hbDir, "images");
    fs.mkdirSync(imgDir);
    wrench.copyDirSyncRecursive(pth.join(rootDir, "images/"), imgDir);
    // copy entities stuff
    fs.copy(pth.join(rootDir, "entities.json"), pth.join(hbDir, "entities.json"));
    // link to author doc
    var index = fs.readFileSync(pth.join(hbDir, "index.html"), "utf-8")
    ,   findDate = /<dt>This Version:<\/dt>\s*<dd><a href="">http:\/\/www.w3.org\/TR\/(\d{4})\/(\w+)-html5-(\d+)/
    ,   res = findDate.exec(index)
    ,   year = res[1]
    ,   status = res[2]
    ,   date = res[3]
    ,   fixAuthorLinks = ["index", "single-page"]
    ;
    console.log(year, status, date);
    for (var i = 0, n = fixAuthorLinks.length; i < n; i++) {
        var page = fixAuthorLinks[i]
        ,   file = pth.join(hbDir, page + ".html")
        ,   content = fs.readFileSync(file, "utf-8")
        ;
        content = content.replace(/href=(?:")?author\/(?:")?>/, "href='http://www.w3.org/TR/" + year + "/" + status + "-html5-author-" + date + "/'>");
        fs.writeFileSync(file, content, "utf-8");
    }
    
    console.log([   "The specification has been generated. You may now wish to:"
                ,   "\t\u2022 Run the link checker on everything (link-checker.js)"
                ,   "\t\u2022 Run pubrules on everything (pubrules.js)"
                 ].join("\n"));
});
