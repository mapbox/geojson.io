const config = require('../config.js')(location.hostname);

module.exports = function (context) {
  const repo = {};

  repo.details = function (callback) {
    const endpoint = config.GithubAPI
      ? config.GithubAPI + '/api/v3/repos/'
      : 'https://api.github.com/repos/';
    const cached = context.storage.get('github_repo_details'),
      meta = context.data.get('meta'),
      login = meta.login,
      repo = meta.repo;

    if (
      cached &&
      cached.login === login &&
      cached.repo === repo &&
      cached.when > +new Date() - 1000 * 60 * 60
    ) {
      callback(null, cached.data);
    } else {
      context.storage.remove('github_repo_details');

      d3.json(endpoint + [login, repo].join('/'))
        .header('Authorization', 'token ' + context.storage.get('github_token'))
        .on('load', onload)
        .on('error', onerror)
        .get();
    }

    function onload(repo) {
      context.storage.set('github_repo_details', {
        when: +new Date(),
        data: repo
      });
      context.storage.set('github_repo', repo);
      callback(null, repo);
    }

    function onerror(err) {
      context.storage.remove('github_repo_details');
      callback(new Error(err));
    }
  };

  return repo;
};
