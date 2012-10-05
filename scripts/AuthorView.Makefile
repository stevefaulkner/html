SVN=svn
SVNFLAGS=
HG=hg
HGFLAGS=

CURL=curl
PYTHON=python
CVS=cvs
CVSFLAGS=
GREP=egrep
GREPFLAGS=
TEE=tee
TEEFLAGS=
PERL=perl
PERLFLAGS=
PATCH=patch
PATCHFLAG=
PARSE=xmllint
PARSEFLAGS=--html --xmlout
XSLTPROC=xsltproc
XSLTPROCFLAGS=--novalid

HTML5=../spec
HTML5URL=http://dev.w3.org/html5/spec/
SPLITTER=html5-tools/spec-splitter/spec-splitter.py
SPLITTERFLAGS=--w3c --html5lib-serialiser --make-index-of-terms
#SPLITTERFLAGS=--w3c --html5lib-parser --html5lib-serialiser --make-index-of-terms
#SPLITTERFLAGS=--w3c --html5lib-serialiser
WHATWGSTYLE = whatwg.css

REVISION=$(shell $(GREP) $(GREPFLAGS) 'This is .+Revision: ' $(HTML5)/Overview.html | $(PERL) $(PERLFLAGS) -pe 's/.*This is .+Revision: (1\.[0-9]+) \$$\./$$1/')

Overview.html: spec.html $(SPLITTER) MANIFEST FILECHECK \
  the-h1-element.html the-h2-element.html the-h3-element.html \
  the-h4-element.html the-h5-element.html the-h6-element.html \
  the-sub-element.html the-sup-element.html

spec.preprocessed.html: $(HTML5)/Overview.html anolis/anolis tools/preprocess.xsl fragment-links.xhtml
	$(XSLTPROC) $(XSLTPROCFLAGS) \
	  --html \
	  --stringparam RCSREVISION $(REVISION) \
	  --stringparam html5 $(HTML5URL) \
	  tools/preprocess.xsl \
	  $(HTML5)/Overview.html \
	  > $@

spec.html: spec.preprocessed.html tools/postprocess.xsl
	$(PYTHON) anolis/anolis \
	  --filter=.impl \
	  --parser=lxml.html \
	  --allow-duplicate-dfns \
	  --enable terms \
	  --output-encoding="ascii" \
	  $< $@.tmp
	 $(PERL) $(PERLFLAGS) -pi -e "s/#9001;/#x27E8;/g" $@.tmp
	 $(PERL) $(PERLFLAGS) -pi -e "s/#9002;/#x27E9;/g" $@.tmp
	$(XSLTPROC) $(XSLTPROCFLAGS) \
	  --html \
	  --stringparam html5 $(HTML5URL) \
	  tools/postprocess.xsl \
	  $@.tmp | \
	$(XSLTPROC) $(XSLTPROCFLAGS) \
	  --html \
	  tools/toc-fix.xsl \
	  - > $@
	$(PERL) $(PERLFLAGS) -pi -e 'undef $$/; s/<!DOCTYPE html PUBLIC "DUMMY" "DUMMY">/<!doctype html>/' $@;
	$(PERL) $(PERLFLAGS) -pi -e "s/load\('styler.js'\);//" $@;
	$(PERL) $(PERLFLAGS) -pi -e "s/<\/dt><\/dt>/<\/dt>/g" $@

MANIFEST: spec.html
	$(PYTHON) $(PYTHONFLAGS) $(SPLITTER) $(SPLITTERFLAGS) $< . \
	  | $(TEE) $(TEEFLAGS) SPLITTERLOG \
	  | $(GREP) $(GREPFLAGS) '<h2>|<h3>|<h4>|<h5>|<h6>' \
	  | cut -c8- \
	  | cut -d " " -f1 \
	  | $(PERL) $(PERLFLAGS) -pe "s/(^[^ ]+)\s*\n/\1.html\n/" > $@
	 cp html5-tools/spec-splitter/link-fixup.js .
	 $(PERL) $(PERLFLAGS) -pi -e "s/#9001;/#x27E8;/g" named-character-references.html
	 $(PERL) $(PERLFLAGS) -pi -e "s/#9002;/#x27E9;/g" named-character-references.html

fragment-links-full.js:
	$(CURL) $(CURLFLAGS) -o $@ $(HTML5URL)fragment-links.js

fragment-links.xhtml: fragment-links-full.js
	$(GREP) $(GREPFLAGS) "var fragment_links" $< \
	  | perl -pe "s|var fragment_links = \{ '|<div xmlns='http://www.w3.org/1999/xhtml'>\n<ul>\n<li>#|" \
	  | perl -pe "s|':'|</li>\n<li>|g" \
	  | perl -pe "s|','|</li>\n</ul>\n<ul>\n<li>#|g" \
	  | perl -pe "s|' };|</li>\n</ul>\n\</div>|g" \
	  > $@

the-h1-element.html: the-h1-h2-h3-h4-h5-and-h6-elements.html
	cp $< $@

the-h2-element.html: the-h1-h2-h3-h4-h5-and-h6-elements.html
	cp $< $@

the-h3-element.html: the-h1-h2-h3-h4-h5-and-h6-elements.html
	cp $< $@

the-h4-element.html: the-h1-h2-h3-h4-h5-and-h6-elements.html
	cp $< $@

the-h5-element.html: the-h1-h2-h3-h4-h5-and-h6-elements.html
	cp $< $@

the-h6-element.html: the-h1-h2-h3-h4-h5-and-h6-elements.html
	cp $< $@

the-sub-element.html: the-sub-and-sup-elements.html
	cp $< $@

the-sup-element.html: the-sub-and-sup-elements.html
	cp $< $@

FILECHECK:
	-$(CVS) $(CVSFLAGS) add *.html 2>&1 | grep -v already
	-$(CVS) $(CVSFLAGS) add index-of-terms/*.html 2>&1 | grep -v already
	touch $@

clean:
	$(RM) spec.preprocessed.html
	$(RM) spec.html.no-impl.tmp
	$(RM) spec.html.tmp
	$(RM) spec.html
	$(RM) fragment-links.xhtml
	$(RM) fragment-links-full.js
	$(MAKE) fragment-links-full.js
	$(MAKE) fragment-links.xhtml
	$(RM) CHANGEDESC
	$(RM) SPLITTERLOG
	$(RM) FILECHECK
	$(RM) the-h1-element.html
	$(RM) the-h2-element.html
	$(RM) the-h3-element.html
	$(RM) the-h4-element.html
	$(RM) the-h5-element.html
	$(RM) the-h6-element.html
	$(RM) the-sub-element.html
	$(RM) the-sup-element.html
	$(RM) -r html5-tools

distclean: clean
	$(RM) -r anolis

CHANGEDESC: $(HTML5)/Overview.html
	$(CVS) $(CVSFLAGS) log -r$(REVISION) $< \
	  | $(GREP) $(GREPFLAGS) -v \
	  "^$$|^RCS file: |^Working file: |^head:|^branch:|^locks:|^access list:|^symbolic names:|^keyword substitution:|^total revisions:|^description:|^revision |^-----|^date: |^=====" \
	  > $@
	@echo >> $@
	@echo "[updated by splitter]" >> $@

# below are some historical targets and comments from DanC when he
# first set up the build

# This was DanC 1st approach; hixie suggested the above technique instead
html5-author2.html: webapps/source anolis/anolis
	anolis/anolis --parser=lxml.html \
		--output-encoding=ascii --w3c-compat-xref-a-placement \
		--filter=.impl webapps/source $@

webapps/source:
	$(SVN) co http://svn.whatwg.org/webapps/


# Another source of clues...
#<rubys> We should use what Hixie provides, but FYI, I've genned a document before using this: http://intertwingly.net/tmp/html5spec

#####
# some dependencies

# this also relies on html5lib and lxml
anolis/anolis: patch.anolis
	$(HG) $(HGFLAGS) clone http://hg.hoppipolla.co.uk/anolis/
	$(PATCH) $(PATCHFLAGS) -p1 -d anolis < $<

$(SPLITTER): patch.spec-splitter.1
	$(SVN) checkout http://html5.googlecode.com/svn/trunk/ html5-tools
	$(PATCH) $(PATCHFLAGS) -p0 < $<

patch.anolis:
	$(HG) $(HGFLAGS) add anolis/anolislib/processes/terms.py
	$(HG) $(HGFLAGS) diff anolis > $@

patch.spec-splitter.1:
	$(SVN) $(SVNFLAGS) diff html5-tools > $@

$(WHATWGSTYLE):
	$(CURL) http://www.whatwg.org/style/specification > $@
