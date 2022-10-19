## Geojson.io API

You can interact with geojson.io programmatically via url parameters:

## URL API

You can do a few interesting things with just URLs and geojson.io. Here are the
current URL formats.

### `map`

Open the map at a specific location. The argument is numbers separated by `/`
in the form `zoom/latitude/longitude`.

#### Example:

http://geojson.io/#map=2/20.0/0.0

### `data=data:application/json,`

Open the map and load a chunk of [GeoJSON](http://geojson.org/) data from a
URL segment directly onto the map. The GeoJSON data should be encoded
as per `encodeURIComponent(JSON.stringify(geojson_data))`.

#### Example:

http://geojson.io/#data=data:application/json,%7B%22type%22%3A%22LineString%22%2C%22coordinates%22%3A%5B%5B0%2C0%5D%2C%5B10%2C10%5D%5D%7D

### `data=data:text/x-url,`

Load GeoJSON data from a URL on the internet onto the map. The URL must
refer directly to a resource that is:

- Freely accessible (not behind a password)
- Supports [CORS](http://en.wikipedia.org/wiki/Cross-origin_resource_sharing)
- Is valid GeoJSON

The URL should be encoded as per `encodeURIComponent(url)`.

#### Example:

http://geojson.io/#data=data:text/x-url,http%3A%2F%2Fapi.tiles.mapbox.com%2Fv3%2Ftmcw.map-gdv4cswo%2Fmarkers.geojson

### `id=gist:`

Load GeoJSON data from a [GitHub Gist](https://gist.github.com/), given an argument
in the form of `login/gistid`. The Gist can be public or private, and must
contain a file with a `.geojson` extension that is valid GeoJSON.

#### Example:

http://geojson.io/#id=gist:tmcw/e9a29ad54dbaa83dee08&map=8/39.198/-76.981

### `id=github:`

Load a file from a GitHub repository. You must have access to the file, and
it must be valid GeoJSON.

The url is in the form:

    login/repository/blob/branch/filepath

#### Example:

http://geojson.io/#id=github:benbalter/dc-wifi-social/blob/master/bars.geojson&map=14/38.9140/-77.0302
