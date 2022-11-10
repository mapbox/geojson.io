module.exports = function (context) {
  if (
    // !/a\.tiles\.mapbox\.com/.test(L.mapbox.config.HTTP_URL) &&
    !require('../config.js')(location.hostname).GithubAPI
  ) {
    return function () {};
  }
  return function (selection) {
    const name = selection.append('a').attr('target', '_blank');

    selection.append('span').text(' | ');

    const action = selection.append('a').attr('href', '#');

    function nextLogin() {
      action.text('login').on('click', login);
      name
        .text('anon')
        .attr('href', '#')
        .on('click', () => {
          d3.event.preventDefault();
        });
    }

    function nextLogout() {
      name.on('click', null);
      action.text('logout').on('click', logout);
    }

    function login() {
      d3.event.preventDefault();
      context.user.authenticate();
    }

    function logout() {
      d3.event.preventDefault();
      context.user.logout();
      nextLogin();
    }

    nextLogin();

    if (context.user.token()) {
      context.user.details((err, d) => {
        if (err) return;
        name.text(d.login);
        name.attr('href', d.html_url);
        nextLogout();
      });
    }
  };
};
