module.exports = function(hostname) {
  // Settings for geojson.net
  if (hostname === "geojson.net") {
    return {
      authService: "https://geojsonnet-auth.now.sh"
    };
    // Customize these settings for your own development/deployment
    // version of geojson.net.
  } else {
    return {
      GithubAPI: null,
      authService: "https://geojsonnet-local-auth.now.sh"
    };
  }
};
