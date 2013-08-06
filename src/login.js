function loginPanel(container) {
    location.href = 'https://github.com/login/oauth/authorize?client_id=' + client_id + '&scope=gist,repo,public_repo';
}

loginPanel.init = function(container) {
    var sel = d3.select(container);
    sel.attr('title', 'login to GitHub');

    function logout() {
        localStorage.removeItem('github_token');
        sel.on('click.logout', null);
        sel.attr('title', 'login to GitHub');
        d3.event.preventDefault();
    }

    function killTokenUrl() {
        if (location.href.indexOf('?code') !== -1) location.href = location.href.replace(/\?code=.*$/, '');
    }

    if (location.search && location.search.indexOf('?code') === 0) {
        var code = location.search.replace('?code=', '');
        d3.json(gatekeeper_url + '/authenticate/' + code)
            .on('load', function(l) {
                if (l.token) localStorage.github_token = l.token;
                killTokenUrl();
            })
            .on('error', function() {
                alert('Authentication with GitHub failed');
            })
            .get();
    }

    if (localStorage.github_token) {
        d3.json('https://api.github.com/user')
            .header('Authorization', 'token ' + localStorage.github_token)
            .on('load', function(user) {
                sel
                    .classed('logged-in', true)
                    .attr('title', 'logout (' + user.login + ')')
                    .on('click.logout', logout);
            })
            .on('error', function() {
                sel.classed('logged-in', false);
                localStorage.removeItem('github_token');
            })
            .get();
    }
};
