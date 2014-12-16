BROWSERIFY = node_modules/.bin/browserify
SMASH = node_modules/.bin/smash
CLEANCSS = node_modules/.bin/cleancss
UGLIFY = node_modules/.bin/uglifyjs
LIBS = $(shell find lib -type f -name '*.js')

all: dist/site.js dist/site.mobile.js dist/delegate.js lib/mapbox.js/latest lib/mapbox.js/latest/mapbox.js

node_modules: package.json
	npm install

dist:
	mkdir -p dist

dist/d3.js: node_modules node_modules/d3/*
	$(SMASH) node_modules/d3/src/start.js \
		node_modules/d3/src/arrays/entries.js \
		node_modules/d3/src/arrays/set.js \
		node_modules/d3/src/arrays/pairs.js \
		node_modules/d3/src/arrays/range.js \
		node_modules/d3/src/behavior/drag.js \
		node_modules/d3/src/core/rebind.js \
		node_modules/d3/src/core/functor.js \
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
		lib/codemirror/lib/codemirror.js \
		lib/codemirror/mode/javascript/javascript.js > dist/lib.js

dist/delegate.js: src/delegate.js
	$(BROWSERIFY)  src/delegate.js > dist/delegate.js

lib/mapbox.js/latest:
	mkdir -p lib/mapbox.js/latest

MapboxAPITile=$$(node -pe "var fs = require('fs'); JSON.parse(fs.readFileSync('./settings.json')).MapboxAPITile.replace(/\/$$/, '');")

lib/mapbox.js/latest/mapbox.js: settings.json
	$(BROWSERIFY) node_modules/mapbox.js > lib/mapbox.js/latest/mapbox.js
	$(UGLIFY) -o lib/mapbox.js/latest/mapbox.js lib/mapbox.js/latest/mapbox.js
	$(CLEANCSS) node_modules/mapbox.js/theme/style.css -o lib/mapbox.js/latest/mapbox.css
	
	@if [ $(MapboxAPITile) ]; then \
		API=$$(node -pe "if (process.argv[1]) JSON.parse(process.argv[1]).api; else console.log('\nERROR: Cannot find MapboxAPITile endpoint at $(MapboxAPITile)\n');" "$$(curl -s $(MapboxAPITile))") && \
		echo "Mapbox API:" $$API && \
		if [ "$$API" = "atlas" ]; then \
			echo "\nL.mapbox.config.HTTP_URL = '$(MapboxAPITile)/v4'; \
			 \nL.mapbox.config.HTTPS_URL = '$(MapboxAPITile)/v4'; \
			 \nL.mapbox.config.REQUIRE_ACCESS_TOKEN = false;" >> lib/mapbox.js/latest/mapbox.js; \
			 touch dist/lib.js; \
		 fi \
	else \
		touch dist/lib.js; \
	fi

dist/site.js: dist/lib.js src/index.js $(shell $(BROWSERIFY) --list src/index.js)
	$(BROWSERIFY) --noparse=src/source/local.js -t brfs -r topojson  src/index.js > dist/site.js

dist/site.mobile.js: dist/lib.js src/mobile.js $(shell $(BROWSERIFY) --list src/mobile.js)
	$(BROWSERIFY) --noparse=src/source/local.js -t brfs -r topojson src/mobile.js > dist/site.mobile.js

clean:
	rm -f dist/*

test:
	npm test
