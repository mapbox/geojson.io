all: src/site.js lib/lib.js

src/site.js: src/index.js src/properties.js
	browserify src/index.js > src/site.js

lib/lib.js: lib/%.js:
	cat lib/d3.v3.min.js \
		lib/d3.trigger.js \
		lib/draw/leaflet.draw.js \
		lib/codemirror/lib/codemirror.js \
		lib/codemirror/mode/javascript/javascript.js \
		lib/zeroclipboard/ZeroClipboard.js \
		lib/FileSaver.min.js > lib/lib.js

clean:
	rm -r lib/lib.js
	rm -r src/site.js
