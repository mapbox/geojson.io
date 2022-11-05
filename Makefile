BROWSERIFY = node_modules/.bin/browserify
SMASH = node_modules/.bin/smash
CLEANCSS = node_modules/.bin/cleancss
UGLIFY = node_modules/.bin/uglifyjs
LIBS = $(shell find lib -type f -name '*.js')

all: dist/site.js dist/site.mobile.js dist/delegate.js \
css/tailwind_dist.css

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
		lib/d3-compat.js > dist/lib.js

dist/delegate.js: src/delegate.js
	$(BROWSERIFY)  src/delegate.js > dist/delegate.js

dist/site.js: dist/lib.js src/index.js $(shell $(BROWSERIFY) --list src/index.js)
	$(BROWSERIFY) --noparse=src/source/local.js -t brfs -r topojson  src/index.js > dist/site.js

dist/site.mobile.js: dist/lib.js src/mobile.js $(shell $(BROWSERIFY) --list src/mobile.js)
	$(BROWSERIFY) --noparse=src/source/local.js -t brfs -r topojson src/mobile.js > dist/site.mobile.js

css/tailwind_dist.css:
	npx tailwindcss -i ./css/tailwind_src.css -o ./css/tailwind_dist.css

css/codemirror.css:
	cat node_modules/codemirror/lib/codemirror.css \
	node_modules/codemirror/addon/fold/foldgutter.css > ./css/codemirror.css

css/fontawesome.css:
	cat node_modules/@fortawesome/fontawesome-free/css/fontawesome.min.css > ./css/fontawesome/css/fontawesome.min.css
	cat node_modules/@fortawesome/fontawesome-free/css/solid.min.css > ./css/fontawesome/css/solid.min.css
	cp -R node_modules/@fortawesome/fontawesome-free/webfonts ./css/fontawesome

css/mapboxgl-bundle.css:
	cat node_modules/mapbox-gl/dist/mapbox-gl.css \
	node_modules/@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css \
	node_modules/@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css > ./css/mapbox-gl-bundle.css
	
clean:
	rm -f dist/*

test:
	npm test
