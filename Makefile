BROWSERIFY = node_modules/.bin/browserify
SMASH = node_modules/.bin/smash
UGLIFY = node_modules/.bin/uglifyjs

all: lib/lib.js src/site.js src/site.mobile.js

lib/d3.min.js: node_modules/d3/*
	$(SMASH) node_modules/d3/src/start.js \
		node_modules/d3/src/arrays/entries.js \
		node_modules/d3/src/arrays/set.js \
		node_modules/d3/src/arrays/range.js \
		node_modules/d3/src/core/rebind.js \
		node_modules/d3/src/event/dispatch.js \
		node_modules/d3/src/event/event.js \
		node_modules/d3/src/selection/select.js \
		node_modules/d3/src/xhr/json.js \
		node_modules/d3/src/end.js > lib/d3.js
	$(UGLIFY) lib/d3.js > lib/d3.min.js

lib/lib.js: lib/%.js:
	cat lib/blob.js \
		lib/base64.js \
		lib/csv2geojson.js \
		lib/geocodemany.js \
		lib/bucket.js \
		lib/queue.js \
		lib/d3.min.js \
		lib/d3.trigger.js \
		lib/draw/leaflet.draw-src.js \
		lib/codemirror/lib/codemirror.js \
		lib/codemirror/mode/javascript/javascript.js \
		lib/FileSaver.min.js > lib/lib.js

src/site.js: src/index.js
	$(BROWSERIFY) -t brfs -r topojson src/index.js > src/site.js

src/site.mobile.js: src/mobile.js
	$(BROWSERIFY) -t brfs -r topojson src/mobile.js > src/site.mobile.js

clean:
	rm -r src/site.js
	rm -r src/site.mobile.js
	rm -r lib/lib.js
