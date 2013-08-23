BROWSERIFY = node_modules/.bin/browserify
LIBS = $(shell find lib -type f -name '*.js')

all: dist dist/lib.js dist/site.js dist/site.mobile.js

dist:
	mkdir -p dist

dist/lib.js: $(LIBS)
	cat lib/blob.js \
		lib/base64.js \
		lib/csv2geojson.js \
		lib/geocodemany.js \
		lib/bucket.js \
		lib/queue.js \
		lib/d3.v3.min.js \
		lib/d3.keybinding.js \
		lib/d3.trigger.js \
		lib/draw/leaflet.draw-src.js \
		lib/codemirror/lib/codemirror.js \
		lib/codemirror/mode/javascript/javascript.js \
		lib/FileSaver.min.js > dist/lib.js

dist/site.js: src/index.js $(shell $(BROWSERIFY) --list src/index.js)
	$(BROWSERIFY) -t brfs -r topojson src/gist.js src/index.js > dist/site.js

dist/site.mobile.js: src/mobile.js
	$(BROWSERIFY) -t brfs -r topojson src/mobile.js > dist/site.mobile.js

clean:
	rm -f dist/*
