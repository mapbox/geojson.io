module.exports = function(context) {
    var user = {};

    user.details = function(callback) {
        if (context.storage.get('github_token')) {
            d3.json('https://api.github.com/user')
                .header('Authorization', 'token ' + context.storage.get('github_token'))
                .on('load', onload)
                .on('error', onerror)
                .get();
        }
        function onload(user) {
            context.storage.set('github_user', user);
            callback(null, user);
        }
        function onerror() {
            user.logout();
            callback(new Error('not logged in'));
        }
    };

    user.logout = function() {
        context.storage.remove('github_token');
    };
};
