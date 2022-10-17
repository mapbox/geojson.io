[![FOSSA Status](https://app.fossa.io/api/projects/git%2Bhttps%3A%2F%2Fgithub.com%2Fmapbox%2Fgeojson.io.svg?type=shield)](https://app.fossa.io/projects/git%2Bhttps%3A%2F%2Fgithub.com%2Fmapbox%2Fgeojson.io?ref=badge_shield)

# geojson.io

![](http://i.cloudup.com/kz3BAF7Hnx.png)

A fast, simple editor for map data. Read more on [Mapbox](https://www.mapbox.com/blog/geojsonio-announce/),
[macwright.org](https://macwright.org/2013/07/26/geojsonio.html).

## Goes Great With!

**Tools**

- [Using geojson.io with GitHub is better with the Chrome Extension](https://chrome.google.com/webstore/detail/geojsonio/oibjgofbhldcajfamjganpeacipebckp)
- [geojsonio-cli](https://github.com/mapbox/geojsonio-cli) lets you shoot geojson from your terminal to geojson.io! (with nodejs)
- [geojsonio.py](https://github.com/jwass/geojsonio.py) lets you shoot geojson from your terminal to geojson.io! (with python)

## API

You can interact with geojson.io programmatically via URL parameters. Here is an example of geojson encoded into the URL:

http://geojson.io/#data=data:application/json,%7B%22type%22%3A%22LineString%22%2C%22coordinates%22%3A%5B%5B0%2C0%5D%2C%5B10%2C10%5D%5D%7D

Full API documentation can be found in [API.md](API.md).

## Development

Install [browserify](https://github.com/substack/node-browserify)'ied libraries:

    `npm install`

Browserify libraries, concat other libraries, build minimal d3:

    `make`

Build tailwind css:

    `npx tailwindcss -i ./css/tailwind_src.css -o ./css/tailwind_dist.css`

Run a local server to preview your changes.

### Development with VSCode

A streamlined dev workflow is possible with the `Live Server` and `Run on Save` VS Code extensions:

- Start a live server using `Live Server's` "Go Live" button
- `Run on Save` reads it settings from `./vscode/settings.json` and will listen for changes to any file, then run both the `make` command and build the tailwind css file on each save.

## License

[![FOSSA Status](https://app.fossa.io/api/projects/git%2Bhttps%3A%2F%2Fgithub.com%2Fmapbox%2Fgeojson.io.svg?type=large)](https://app.fossa.io/projects/git%2Bhttps%3A%2F%2Fgithub.com%2Fmapbox%2Fgeojson.io?ref=badge_large)
