all: lib/lib.js

lib/lib.js: lib/%.js:
	cat lib/geojsonhint.js \
		lib/metatable.js \
		lib/blob.js \
		lib/togeojson.js \
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

clean:
	rm -r lib/lib.js
