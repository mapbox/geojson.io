const config = require('../config.js')(location.hostname);

module.exports = function (context) {
  const user = {};

  user.details = function (callback) {
    if (!context.storage.get('github_token'))
      return callback(new Error('not logged in'));

    const cached = context.storage.get('github_user_details');

    if (cached && cached.when > +new Date() - 1000 * 60 * 60) {
      callback(null, cached.data);
    } else {
      context.storage.remove('github_user_details');
      const endpoint = config.GithubAPI
        ? config.GithubAPI + '/api/v3'
        : 'https://api.github.com';

      d3.json(endpoint + '/user')
        .header('Authorization', 'token ' + context.storage.get('github_token'))
        .on('load', onload)
        .on('error', onerror)
        .get();
    }

    function onload(user) {
      context.storage.set('github_user_details', {
        when: +new Date(),
        data: user
      });
      context.storage.set('github_user', user);
      callback(null, user);
    }

    function onerror() {
      user.logout();
      context.storage.remove('github_user_details');
      callback(new Error('not logged in'));
    }
  };

  user.signXHR = function (xhr) {
    return user.token()
      ? xhr.header('Authorization', 'token ' + user.token())
      : xhr;
  };

  user.authenticate = function () {
    window.location.href =
      (config.GithubAPI || 'https://github.com') +
      '/login/oauth/authorize?client_id=' +
      config.client_id +
      '&scope=gist,repo';
  };

  user.token = function () {
    return context.storage.get('github_token');
  };

  user.logout = function () {
    context.storage.remove('github_token');
  };

  user.login = function () {
    context.storage.remove('github_token');
  };

  function killTokenUrl() {
    if (window.location.href.indexOf('?code') !== -1) {
      window.location.href = window.location.href.replace(/\?code=.*$/, '');
    }
  }

  if (window.location.search && window.location.search.indexOf('?code') === 0) {
    const code = window.location.search.replace(
      // eslint-disable-next-line
      /\?{0,1}code=([^\#\&]+).*$/g,
      '$1'
    );
    d3.select('.map').classed('loading', true);
    d3.json(config.gatekeeper_url + '/authenticate/' + code)
      .on('load', (l) => {
        d3.select('.map').classed('loading', false);
        if (l.token) window.localStorage.github_token = l.token;
        killTokenUrl();
      })
      .on('error', () => {
        d3.select('.map').classed('loading', false);
        alert('Authentication with GitHub failed');
      })
      .get();
  }

  return user;
};
