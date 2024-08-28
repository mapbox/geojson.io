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

https://geojson.io/#data=data:application/json,%7B%22type%22%3A%22LineString%22%2C%22coordinates%22%3A%5B%5B0%2C0%5D%2C%5B10%2C10%5D%5D%7D

Full API documentation can be found in [API.md](API.md).

## Development

1. Clone this repository
2. Install dependencies
3. Run `npm start`

`npm start` uses `concurrently` to run `live-server` which will serve the project directory in your browser and listen for changes, `rollup` which will build the js and css bundles, and `npx tailwindcss` which builds `css/tailwind_dist.css` (including only the tailwind rules needed in the project)

`rollup` can take several seconds to build before changes appear in the browser.

## Production Build & Deployment

`npm run build` will create minified bundles in `/dist`. You can try out the production build with `npm run serve` which will run live-server.

To deploy to github pages, use `npm run deploy`.  This will run the deploy script in `deploy.sh`, which creates a new orphan branch from the current branch, runs a production build, and force pushes to the `gh-pages` branch.

## License

[![FOSSA Status](https://app.fossa.io/api/projects/git%2Bhttps%3A%2F%2Fgithub.com%2Fmapbox%2Fgeojson.io.svg?type=large)](https://app.fossa.io/projects/git%2Bhttps%3A%2F%2Fgithub.com%2Fmapbox%2Fgeojson.io?ref=badge_large)
