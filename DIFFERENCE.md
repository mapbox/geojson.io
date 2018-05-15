### Notes

This is a fork of geojson.io, aimed at continuing the original ethos of the project:

- Change slow
- Be useful
- Don't break things

Unfortunately, geojson.io has been slowly breaking simply due to the web moving
forward and the site not keeping up. Most notably, GitHub authentication broke
once Google Chrome started to be strict about HTTPS security. Along with that,
geolocation broke for the same reason.

### Changes

**The first task is to switch to HTTPS.** geojson.io uses gatekeeper, [which is pretty stalled](https://github.com/prose/gatekeeper/issues/38).
[micro-github](https://github.com/mxstbr/micro-github) replaces it and also simplifies
the authentication flow.
