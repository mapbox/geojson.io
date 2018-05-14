[![Circle CI](https://circleci.com/gh/mapbox/geojson.io/tree/gh-pages.svg?style=svg)](https://circleci.com/gh/mapbox/geojson.io/tree/gh-pages)

# geojson.net

_Son of geojson.io_

A fast, simple editor for map data. Read more on [Mapbox](http://www.mapbox.com/blog/geojsonio-announce/),
[macwright.org](http://macwright.org/2013/07/26/geojsonio.html).

## Goes Great With!

**Tools**

* [Using geojson.io with GitHub is better with the Chrome Extension](https://chrome.google.com/webstore/detail/geojsonio/oibjgofbhldcajfamjganpeacipebckp)
* [geojsonio-cli](https://github.com/mapbox/geojsonio-cli) lets you shoot geojson from your terminal to geojson.io! (with nodejs)
* [geojsonio.py](https://github.com/jwass/geojsonio.py) lets you shoot geojson from your terminal to geojson.io! (with python)
* [reproject](https://github.com/perliedman/reproject) reprojects geojson on the fly, and then you can pipe to geojson.io!

**Sites**

* [GitSpatial](https://github.com/JasonSanford/gitspatial) makes GeoJSON on GitHub more like an API

## API

You can interact with geojson.io programmatically in two ways:
- [URL parameters](API.md#url-api)
- [Browser console](API.md#console-api)

Full API documentation can be found in [API.md](API.md).

## Development

Install [browserify](https://github.com/substack/node-browserify)'ied libraries:

    npm install

Browserify libraries, concat other libraries, build minimal d3:

    make

Run a local server with [visionmedia/serve](https://github.com/visionmedia/serve):

    serve -p 8080

Port 8080 is recommended because by default geojson.io will use a
[prose/gatekeeper](https://github.com/prose/gatekeeper) auth server that redirects
back to `http://localhost:8080/` for GitHub OAuth.

## See Also

* [MapBox](https://www.mapbox.com/) for all of the APIs used in geojson.io
* [uMap](https://umap.openstreetmap.fr) is a similar tool with its own data storage
