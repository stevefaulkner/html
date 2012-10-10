#!/usr/bin/env node

var fs  = require("fs.extra")
,   pth = require("path")
,   exec = require("child_process").exec
,   jsdom = require("jsdom")
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
    ,   microdata:    {
            outDir:     "heartbeat-md"
        ,   make:       "microdata"
        ,   makeDir:    "output/microdata/"
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

function finalise () {
    // copy the images
    var imgDir = pth.join(hbDir, "images")
    ,   fontDir = pth.join(hbDir, "fonts")
    ;
    if (target !== "microdata") fs.mkdirSync(imgDir);
    fs.mkdirSync(fontDir);
    if (target !== "microdata") wrench.copyDirSyncRecursive(pth.join(rootDir, "images/"), imgDir);
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
}

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
        ,   notFoundDir = pth.join(rootDir, "404/")
        ,   files404 = fs.readdirSync(notFoundDir)
        ;
        for (var i = 0, n = files404.length; i < n; i++) {
            var f4 = files404[i];
            fs.copy(pth.join(notFoundDir, f4), pth.join(hbDir, f4));
        }

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
    else if (target === "2d" || target === "microdata") {
        var file = pth.join(hbDir, "Overview.html")
        ,   content = fs.readFileSync(file, "utf-8");
        content = content
                    .replace(/src: url\('..\/fonts\/Essays1743/g, "src: url('fonts/Essays1743");
        fs.writeFileSync(file, content, "utf-8");
    }
    if (target === "microdata") {
        // bunch of brute-force fixes to make this look like a real document
        var file = pth.join(hbDir, "Overview.html");
        jsdom.env(
            file
        ,   [pth.join(rootDir, "scripts/jquery.min.js")]
        ,   function (err, window) {
                if (err) return console.log(err);
                var $ = window.$
                ,   doc = window.document
                ;
                // move HTMLProp to inside Microdata APIs
                var $toc = $("ol.toc").first()
                ,   $mdOL = $toc.find("a[href=#htmlpropertiescollection]").parent().parent()
                ,   $apiLI = $toc.find("a[href=#microdata-dom-api]").parent()
                ;
                $apiLI.append($mdOL);
                //  - also move the actual section
                var $hpTit = $("#htmlpropertiescollection")
                ,   sectionContent = [$hpTit]
                ,   $nxt = $hpTit.next()
                ;
                while (true) {
                    if ($nxt.is("h1,h2,h3,h4,h5,h6")) break;
                    sectionContent.push($nxt);
                    $nxt = $nxt.next();
                }
                var $other = $("#other-changes-to-html5");
                for (var i = 0, n = sectionContent.length; i < n; i++) $other.before(sectionContent[i]);
                
                //  - move all other 0.x to top-level
                var $li1 = $toc.find("li").first();
                $toc.prepend($li1.find("ol").first().contents());
                $li1.remove();
                
                //  - update all toc to have the right numbers
                function numberToc ($parent, current, level) {
                    var $secs = $parent.children("li");
                    if ($secs.length === 0) return null;
                    for (var i = 0; i < $secs.length; i++) {
                        current[current.length - 1]++;
                        var $sec = $($secs[i], doc)
                        ,   secnos = current.slice()
                        ,   secno = secnos.join(".");
                        if (secnos.length === 1) secno = secno + ".";
                        $sec.find("span.secno").first().text(secno + " ");
                        if ($sec.find("ol").length) {
                            current.push(0);
                            numberToc($sec.find("ol").first(), current, level + 1);
                            current.pop();
                        }
                    }
                }
                numberToc($toc, [0], 1);
                
                //  - for each toc item, go to link
                //      - update html of title to match
                //      - upgrade hN to the correct level if required
                $toc.find("a[href^=#]").each(function () {
                    var $a = $(this)
                    //  some of the weirder IDs don't "just work" with jQ
                    ,   $target = $(doc.getElementById($a.attr("href").replace("#", "")))
                    ,   depth = $a.parents("ol").length + 1
                    ;
                    if ($target.is("h" + depth)) {
                        $target.html($a.html());
                    }
                    else {
                        var $h = $(doc.createElement("h" + depth));
                        for (var i = 0, n = $target[0].attributes.length; i < n; i++) {
                            var at = $target[0].attributes[i];
                            $h.attr(at.name, at.value);
                        }
                        $h.html($a.html());
                        $target.replaceWith($h);
                    }
                });


                // serialise back to disk...
                $(".jsdom").remove();
                fs.writeFileSync(file, doc.doctype.toString() + doc.innerHTML, "utf8");
                
                finalise();
            }
        );

    }
    else {
        finalise();
    }
});
