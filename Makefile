BROWSERIFY = node_modules/.bin/browserify
SMASH = node_modules/.bin/smash
UGLIFY = node_modules/.bin/uglifyjs
LIBS = $(shell find lib -type f -name '*.js')

all: node_modules dist dist/lib.js dist/site.js dist/site.mobile.js

dist:
	mkdir -p dist

dist/d3.min.js: node_modules/d3/*
	$(SMASH) node_modules/d3/src/start.js \
		node_modules/d3/src/arrays/entries.js \
		node_modules/d3/src/arrays/set.js \
		node_modules/d3/src/arrays/range.js \
		node_modules/d3/src/behavior/drag.js \
		node_modules/d3/src/core/rebind.js \
		node_modules/d3/src/event/dispatch.js \
		node_modules/d3/src/event/event.js \
		node_modules/d3/src/selection/select.js \
		node_modules/d3/src/selection/transition.js \
		node_modules/d3/src/transition/each.js \
		node_modules/d3/src/xhr/json.js \
		node_modules/d3/src/xhr/json.js \
		node_modules/d3/src/time/time.js \
		node_modules/d3/src/time/format.js \
		node_modules/d3/src/xhr/text.js \
		node_modules/d3/src/geo/mercator.js \
		node_modules/d3/src/geo/path.js \
		node_modules/d3/src/end.js > dist/d3.js
	$(UGLIFY) dist/d3.js > dist/d3.min.js

node_modules/d3:
	npm install

dist/lib.js: $(LIBS) dist/d3.min.js
	cat dist/d3.min.js \
		lib/blob.js \
		lib/base64.js \
		lib/csv2geojson.js \
		lib/geocodemany.js \
		lib/bucket.js \
		lib/queue.js \
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
