# geojson.io

### Follow [@geojsonio](https://twitter.com/geojsonio) to keep up with geojson.io's evolution

![](http://i.cloudup.com/kz3BAF7Hnx.png)

A fast, simple editor for map data. Read more on [MapBox](http://www.mapbox.com/blog/geojsonio-announce/),
[macwright.org](http://macwright.org/2013/07/26/geojsonio.html).

## Goes Great With!

**Tools**

* [Using geojson.io with GitHub is better with the Chrome Extension](https://chrome.google.com/webstore/detail/geojsonio/oibjgofbhldcajfamjganpeacipebckp)
* [geojsonio-cli](https://github.com/mapbox/geojsonio-cli) lets you shoot geojson from your terminal to geojson.io! (with nodejs)
* [geojsonio.py](https://github.com/jwass/geojsonio.py) lets you shoot geojson from your terminal to geojson.io! (with python)
* [reproject](https://github.com/perliedman/reproject) reprojects geojson on the fly, and then you can pipe to geojson.io!

**Sites**

* [GitSpatial](http://gitspatial.com/) makes GeoJSON on GitHub more like an API

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

## Libraries

This is made up of small reusable chunks:

* <a href='http://github.com/mapbox/d3-metatable'>mapbox/d3-metatable</a>
* <a href='http://github.com/mapbox/geojsonhint'>mapbox/geojsonhint</a>
* <a href='http://github.com/mapbox/d3-bucket-ui'>mapbox/d3-bucket-ui</a>
* <a href='http://github.com/mapbox/geocode-many'>mapbox/geocode-many</a>
* <a href='http://github.com/mapbox/csv2geojson'>mapbox/csv2geojson</a>
* <a href='http://github.com/mapbox/togeojson'>mapbox/togeojson</a>
* <a href='https://github.com/aaronlidman/osm-and-geojson'>aaronlidman/osm-and-geojson</a>

## See Also

* [TileMill](http://www.mapbox.com/tilemill/) for styling maps
* [MapBox](http://www.mapbox.com/) for all of the APIs used in geojson.io
