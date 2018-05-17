### Notes

This is a fork of geojson.io, aimed at continuing the original ethos of the project:

- Be useful
- Change slow
- Be as generic as possible

Unfortunately, geojson.io has been slowly breaking simply due to the web moving
forward and the site not keeping up. Most notably, GitHub authentication broke
once Google Chrome started to be strict about HTTPS security. Along with that,
geolocation broke for the same reason.

### FAQ

- **Does this replace geojson.io?** Yep.
- **Why not a PR to geojson.io?** Nobody is reviewing or merging PRs to geojson.io or any of its component
  projects, or answering issues.

### Changes

**The first task is to switch to HTTPS.** geojson.io uses gatekeeper, [which is pretty stalled](https://github.com/prose/gatekeeper/issues/38).
[micro-github](https://github.com/mxstbr/micro-github) replaces it and also simplifies
the authentication flow.

**Next we disable Google Analytics and gaug.es**: this site should be as private
as can be.

**Then we merge up to remote PRs: update d3 to v5, add GPX export.** And, soon,
support larger Gists.

**Modernized the build pipeline**: Makefile + browserify + smash → parcel.

### Changes now

**Modernization**: using React.
