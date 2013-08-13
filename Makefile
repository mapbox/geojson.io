all: lib/lib.js src/site.js src/site.mobile.js

lib/lib.js: lib/%.js:
	cat lib/blob.js \
		lib/base64.js \
		lib/csv2geojson.js \
		lib/geocodemany.js \
		lib/bucket.js \
		lib/queue.js \
		lib/d3.v3.min.js \
		lib/d3.trigger.js \
		lib/draw/leaflet.draw-src.js \
		lib/codemirror/lib/codemirror.js \
		lib/codemirror/mode/javascript/javascript.js \
		lib/FileSaver.min.js > lib/lib.js

src/site.js: src/index.js
	browserify -t brfs -r topojson src/index.js > src/site.js

src/site.mobile.js: src/mobile.js
	browserify -t brfs -r topojson src/mobile.js > src/site.mobile.js

clean:
	rm -r lib/lib.js
