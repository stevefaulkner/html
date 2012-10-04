dummy:
	@echo "USAGE: make [html|2dcontext|author|all]"

all: html 2dcontext
html: output/html/single-page.html
author: output/author/single-page.html
2dcontext: output/2dcontext/single-page.html

output/html/single-page.html: source
	python scripts/publish.py html

output/author/single-page.html: source
	python scripts/publish.py author

output/2dcontext/single-page.html: source
	python scripts/publish.py 2dcontext
