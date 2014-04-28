var User = require('../src/core/user'),
    tape = require('tape');

tape('user', function(t) {
    var context = {
        storage: {
            get: function() {
                return null;
            }
        }
    };
    var user = User(context);
    t.ok(user, 'creates a user object');
    user.details(function(err, res) {
        t.equal(err.message, 'not logged in');
        t.end();
    });
});
