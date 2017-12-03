BROWSERIFY = node_modules/.bin/browserify
CLEANCSS = node_modules/.bin/cleancss
UGLIFY = node_modules/.bin/uglifyjs
LIBS = $(shell find lib -type f -name '*.js')

all: dist/site.js dist/site.mobile.js dist/delegate.js lib/mapbox.js/latest lib/mapbox.js/latest/mapbox.js

node_modules: package.json
	npm install

dist:
	mkdir -p dist

dist/d3.js: node_modules node_modules/d3/*
	cat node_modules/d3-selection/build/d3-selection.js \
	  node_modules/d3-dispatch/build/d3-dispatch.js \
	  node_modules/d3-array/build/d3-array.js \
	  node_modules/d3-collection/build/d3-collection.js \
	  node_modules/d3-metatable/build/d3-metatable.js \
	  node_modules/d3-ease/build/d3-ease.js \
	  node_modules/d3-transition/build/d3-transition.js \
	  node_modules/d3-timer/build/d3-timer.js \
	  node_modules/d3-color/build/d3-color.js \
	  node_modules/d3-interpolate/build/d3-interpolate.js \
	  node_modules/d3-request/build/d3-request.js > dist/d3.js

dist/d3.min.js: dist/d3.js
	$(UGLIFY) dist/d3.js > dist/d3.min.js

dist/lib.js: dist dist/d3.js $(LIBS)
	cat dist/d3.js \
		lib/hashchange.js \
		lib/blob.js \
		lib/base64.js \
		lib/bucket.js \
		lib/queue.js \
		lib/d3.keybinding.js \
		lib/d3.trigger.js \
		lib/d3-compat.js \
		lib/draw/leaflet.draw-src.js \
		lib/drag/leaflet.drag.js \
		lib/codemirror/lib/codemirror.js \
		lib/codemirror/mode/javascript/javascript.js > dist/lib.js

dist/delegate.js: src/delegate.js
	$(BROWSERIFY)  src/delegate.js > dist/delegate.js

lib/mapbox.js/latest:
	mkdir -p lib/mapbox.js/latest

lib/mapbox.js/latest/mapbox.js: node_modules/mapbox.js/*
	$(BROWSERIFY) node_modules/mapbox.js > lib/mapbox.js/latest/mapbox.js
	$(UGLIFY) -o lib/mapbox.js/latest/mapbox.js lib/mapbox.js/latest/mapbox.js
	cp -r node_modules/mapbox.js/theme/images/ lib/mapbox.js/latest/images/
	$(CLEANCSS) -o lib/mapbox.js/latest/mapbox.css --skip-rebase node_modules/mapbox.js/theme/style.css

dist/site.js: dist/lib.js src/index.js $(shell $(BROWSERIFY) --list src/index.js)
	$(BROWSERIFY) --noparse=src/source/local.js -t brfs -r topojson  src/index.js > dist/site.js

dist/site.mobile.js: dist/lib.js src/mobile.js $(shell $(BROWSERIFY) --list src/mobile.js)
	$(BROWSERIFY) --noparse=src/source/local.js -t brfs -r topojson src/mobile.js > dist/site.mobile.js

clean:
	rm -f dist/*

test:
	npm test
