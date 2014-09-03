## How do I add another tile layer to geojson.io?

[Use the Console API](https://github.com/mapbox/geojson.io/blob/gh-pages/API.md#console-api)

## Can I use geojson.io with some other source / API?

Yes, if you implement that. geojson.io currently works with GitHub - you would need to implement a new [source](https://github.com/mapbox/geojson.io/tree/gh-pages/src/source).
This is an exercise for the reader - you'll need to figure out how to do this on your own.

## Can I use geojson.io with my own server / authentication?

Yes, if you set up your own gatekeeper instance and [configure your instance with your own api keys](https://github.com/mapbox/geojson.io/blob/gh-pages/src/config.js).
Like the previous question, you will need to figure this out.

## Where's the Server?

There is none - geojson.io is a static application that's hosted on GitHub Pages, and could be hosted anywhere
else, as static files.

## Where are the Templates?

There are none - geojson.io bootstraps its entire user interface with JavaScript and d3. It does not use templates.
