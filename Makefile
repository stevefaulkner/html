dummy:
	@echo "USAGE: make [html|2dcontext|all]"

all: html 2dcontext
html: output/html/single-page.html
2dcontext: output/2dcontext/single-page.html

output/html/single-page.html: source
	python scripts/publish.py html

output/2dcontext/single-page.html: source
	python scripts/publish.py 2dcontext
