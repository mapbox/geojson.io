all: site.js

site.js: index.js
	browserify index.js > site.js
