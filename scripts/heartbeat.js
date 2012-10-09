#!/usr/bin/env node

var fs  = require("fs.extra")
,   pth = require("path")
,   exec = require("child_process").exec
,   wrench = require("wrench")
;

// basic setup
var target = process.argv[2] || "html"
,   fullConf = {
        html:   {
            outDir:     "heartbeat"
        ,   make:       "html"
        ,   makeDir:    "output/html/"
        }
    ,   "2d":    {
            outDir:     "heartbeat-2d"
        ,   make:       "2dcontext"
        ,   makeDir:    "output/2dcontext/"
        }
    }
,   conf = fullConf[target]
,   rootDir = pth.join(__dirname, "..")
,   hbDir = pth.join(rootDir, conf.outDir)
;

function rename (src, to) {
    try {
        fs.renameSync(src, to);
    }
    catch (e) {
        console.log("Error renaming " + src + " to " + to);
    }
}

if (fs.existsSync(hbDir)) wrench.rmdirSyncRecursive(hbDir);
fs.mkdirSync(hbDir);

// build the spec
exec("make " + conf.make, { cwd: rootDir }, function (err, stdout, stderr) {
    console.log(stdout);
    console.log(stderr);
    if (err) throw err;
    wrench.copyDirSyncRecursive(pth.join(rootDir, conf.makeDir), hbDir);
    // file renames
    if (target === "html") {
        rename(pth.join(hbDir, "index.html"), pth.join(hbDir, "section-index.html"));
        rename(pth.join(hbDir, "spec.html"), pth.join(hbDir, "index.html"));
        // in every single file in there, replace spec.html with index.html
        var files = fs.readdirSync(hbDir)
        ,   entContent = fs.readFileSync(pth.join(rootDir, "boilerplate/entities-dtd.url"))
        ;
        for (var i = 0, n = files.length; i < n; i++) {
            var file = pth.join(hbDir, files[i]);
            if (!file.match(/\.html$/)) continue;
            var content = fs.readFileSync(file, "utf-8");
            // the below looks weird because for reasons beyond human understanding,
            // JS does not support zero-width negative lookbehinds
            content = content
                        .replace(/src: url\('..\/fonts\/Essays1743/g, "src: url('fonts/Essays1743")
                        .replace(/&lt;!--BOILERPLATE%20entities-dtd\.url--&gt;/g, entContent)
                        .replace(/<!--BOILERPLATE entities-dtd\.url-->/g, entContent)
                        .replace(/\bsection-index\.html/g, "REPLACE-ME-SECTION-INDEX")
                        .replace(/\"index\.html\b/g, "\"section-index.html")
                        .replace(/REPLACE-ME-SECTION-INDEX/g, "section-index.html")
                        .replace(/\bspec\.html\b/g, "index.html")
                        .replace(/(?:<\/dt>){2,}/g, "")
                        .replace(/(?:<\/dd>){2,}/g, "")
                        ;
            fs.writeFileSync(file, content, "utf-8");
        }
    }
    else if (target === "2d") {
        var file = pth.join(hbDir, "Overview.html")
        ,   content = fs.readFileSync(file, "utf-8");
        content = content
                    .replace(/src: url\('..\/fonts\/Essays1743/g, "src: url('fonts/Essays1743");
        fs.writeFileSync(file, content, "utf-8");
    }
    // copy the images
    var imgDir = pth.join(hbDir, "images")
    ,   fontDir = pth.join(hbDir, "fonts")
    ;
    fs.mkdirSync(imgDir);
    fs.mkdirSync(fontDir);
    wrench.copyDirSyncRecursive(pth.join(rootDir, "images/"), imgDir);
    wrench.copyDirSyncRecursive(pth.join(rootDir, "fonts/"), fontDir);
    // copy entities stuff
    if (target === "html") {
        fs.copy(pth.join(rootDir, "entities.json"), pth.join(hbDir, "entities.json"));
        // link to author doc
        var index = fs.readFileSync(pth.join(hbDir, "index.html"), "utf-8")
        ,   findDate = /<dt>This Version:<\/dt>\s*<dd><a href="http:\/\/www.w3.org\/TR\/(\d{4})\/(\w+)-html5-(\d+)/
        ,   res = findDate.exec(index)
        ,   year = res[1]
        ,   status = res[2]
        ,   date = res[3]
        ,   fixAuthorLinks = ["index", "single-page"]
        ;
        for (var i = 0, n = fixAuthorLinks.length; i < n; i++) {
            var page = fixAuthorLinks[i]
            ,   file = pth.join(hbDir, page + ".html")
            ,   content = fs.readFileSync(file, "utf-8")
            ;
            content = content.replace(/href=(?:")?author\/(?:")?>/, "href='http://www.w3.org/TR/" + year + "/" + status + "-html5-author-" + date + "/'>");
            fs.writeFileSync(file, content, "utf-8");
        }
    }
    
    console.log([   "The specification has been generated. You may now wish to:"
                ,   "\t\u2022 Run the link checker on everything (link-checker.js)"
                ,   "\t\u2022 Run pubrules on everything (pubrules.js)"
                 ].join("\n"));
});
