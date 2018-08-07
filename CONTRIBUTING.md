# geojson.io Contributing

Note: development of geojson.io is currently paused. You may be interested in the new fork at https://geojson.net. Until development restarts, please refrain from adding issues to the tracker.

FAQ

Q: **Why are my coordinates flipped?**

A: In the [GeoJSON](http://geojson.org/) format, longitude comes first, before
latitude.

Q: **Isn't that wrong?**

A: No, [almost every kind of spatial file that exists, including KML and Shapefiles](http://www.macwright.org/lonlat/),
does the same thing. Math also tends to tell things in X, Y order, and we usually
size things by width and then height.

Q: **Why does geojson.io require access to private repos?**

A: Because if it didn't, you wouldn't be able to open files in your private
repos via GitHub.
