module.exports = function(context) {
    return function(selection) {
        var name = selection.append('a')
            .attr('target', '_blank');

        selection.append('span').text(' | ');

        var action = selection.append('a')
            .attr('href', '#');

        function nextLogin() {
            action.text('login').on('click', login);
            name
                .text('anon')
                .attr('href', '#')
                .on('click', function() { d3.event.preventDefault(); });
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
            context.user.details(function(err, d) {
                if (err) return;
                name.text(d.login);
                name.attr('href', d.html_url);
                nextLogout();
            });
        }
    };
};
