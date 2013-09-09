# geojson.io

![](http://i.cloudup.com/kz3BAF7Hnx.png)

A fast, simple editor for map data. Read more on [MapBox](http://www.mapbox.com/blog/geojsonio-announce/),
[macwright.org](http://macwright.org/2013/07/26/geojsonio.html).

## chrome extension

[![](http://farm8.staticflickr.com/7427/9501469193_1f3522dee8_o.png)](https://chrome.google.com/webstore/detail/geojsonio/oibjgofbhldcajfamjganpeacipebckp)

[Using geojson.io with GitHub is better with the Chrome Extension](https://chrome.google.com/webstore/detail/geojsonio/oibjgofbhldcajfamjganpeacipebckp)

## development

Libraries are concatenated into `dist/lib.js` by running `make`.

Run a local server with [visionmedia/serve](https://github.com/visionmedia/serve):

    serve -p 8080

Port 8080 is recommended because by default geojson.io will use a
[prose/gatekeeper](https://github.com/prose/gatekeeper) auth server that redirects
back to `http://localhost:8080/` for GitHub OAuth.

## libraries

This is made up of small reusable chunks:

* <a href='http://github.com/mapbox/d3-metatable'>github.com/mapbox/d3-metatable</a>
* <a href='http://github.com/mapbox/geojsonhint'>github.com/mapbox/geojsonhint</a>
* <a href='http://github.com/mapbox/d3-bucket-ui'>github.com/mapbox/d3-bucket-ui</a>
* <a href='http://github.com/mapbox/geocode-many'>github.com/mapbox/geocode-many</a>
* <a href='http://github.com/mapbox/csv2geojson'>github.com/mapbox/csv2geojson</a>
* <a href='http://github.com/mapbox/togeojson'>github.com/mapbox/togeojson</a>

## see also

* [TileMill](http://www.mapbox.com/tilemill/) for styling maps
* [MapBox](http://www.mapbox.com/) for all of the APIs used in geojson.io
