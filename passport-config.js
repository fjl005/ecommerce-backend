const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcrypt');
const User = require('./models/User');

/* This code will be run whenever we run passport.authenticate in our code. 

Configure a LocalStrategy for username/password authentication. Passport.use will perform the configuration. There is only one parameter, which we define as the LocalStrategy (to authenticate based on user/pw). But this LocalStrategy class takes in two parameters: first is the items of authentication (which in this case is username and password, though the password is assumed), and the second is a callback function.

The callback function takes the requests of the LocalStrategy and a done callback function. 

Done is a callback function that takes three parameters: (1) error (null if no error), (2) user (false if no user), and (3) message (to display the error).
*/
passport.use(new LocalStrategy({ usernameField: 'username' }, async (username, password, done) => {
    try {
        const user = await User.findOne({ username: username });

        if (!user) {
            return done(null, false, { message: 'Username not found' });
        }

        bcrypt.compare(password, user.password, (error, isMatch) => {
            if (error) throw error;
            if (isMatch) {
                return done(null, user);
            } else {
                return done(null, false, { message: 'Password incorrect' });
            }
        });
    } catch (error) {
        console.log('Error: ', error);
        return done(error);
    }
}));


// Serialize the user object to store in the session
passport.serializeUser((user, done) => {
    done(null, user.id);
});

// Deserialize the user object from the session
passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id);
        done(null, user);
    } catch (error) {
        done(error, null);
    }
});

module.exports = passport;