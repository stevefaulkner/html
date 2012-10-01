dummy:
	@echo "USAGE: make [html|2dcontext|srcset|all]"

all: html 2dcontext srcset
html: output/html/single-page.html
2dcontext: output/2dcontext/single-page.html
srcset: output/srcset/single-page.html

output/html/single-page.html: source
	python scripts/publish.py html

output/2dcontext/single-page.html: source
	python scripts/publish.py 2dcontext

output/srcset/single-page.html: source
	python scripts/publish.py srcset
