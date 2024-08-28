## Geojson.io API

You can interact with geojson.io programmatically in two ways:

* [URL parameters](#url-api)
* [Browser console](#console-api)

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
- Supports [CORS](https://en.wikipedia.org/wiki/Cross-origin_resource_sharing)
- Is valid GeoJSON

The URL should be encoded as per `encodeURIComponent(url)`.

#### Example:

https://geojson.io/#data=data:text/x-url,https%3A%2F%2Fraw.githubusercontent.com%2Fcodeforgermany%2Fclick_that_hood%2Fmain%2Fpublic%2Fdata%2Fcalifornia-counties.geojson

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

https://geojson.io/#id=github:benbalter/dc-wifi-social/blob/master/bars.geojson&map=14/38.9140/-77.0302

## Console API

Pop open your browser console and see the beautiful examples: geojson.io has started to expose a subset of its inner workings for you to mess around with:


### `window.api.map`

The [Mapbox GL JS](https://docs.mapbox.com/mapbox-gl-js/guides/) map that you see and use on the site. See the [Mapbox GL JS API Reference](https://docs.mapbox.com/mapbox-gl-js/api/) for all the things you can do with it.

For instance, you could add another map source and layer:

```js
window.api.map.addSource('raster-tiles', {
    'type': 'raster',
    'tiles': [
    'https://stamen-tiles.a.ssl.fastly.net/watercolor/{z}/{x}/{y}.jpg'
    ],
    'tileSize': 256,
    'attribution':
    'Map tiles by <a target="_top" rel="noopener" href="https://stamen.com">Stamen Design</a>, under <a target="_top" rel="noopener" href="https://creativecommons.org/licenses/by/3.0">CC BY 3.0</a>. Data by <a target="_top" rel="noopener" href="https://openstreetmap.org">OpenStreetMap</a>, under <a target="_top" rel="noopener" href="https://creativecommons.org/licenses/by-sa/3.0">CC BY SA</a>'
})

window.api.map.addLayer({
    'id': 'simple-tiles',
    'type': 'raster',
    'source': 'raster-tiles',
    'minzoom': 0,
    'maxzoom': 22
})
```

### `window.api.data`

The data model. See the [code to get an idea of how it works](https://github.com/mapbox/geojson.io/blob/main/src/core/data.js#L46-L101) -
you'll want to use stuff like `data.set({ map: { .. your geojson map information .. })`
and `data.get('map')` and `data.mergeFeatures([arrayoffeatures])` to do your
dirty business.

## `window.api.draw`

Exposes the [mapbox-gl-draw](https://github.com/mapbox/mapbox-gl-draw) instance in the console.

## `window.api.on(event, fn)`

Exposes d3 events, including `change`.