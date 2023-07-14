const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcrypt');
const User = require('./models/User');

// This code will be run whenever we run passport.authenticate in our code.
module.exports = function (passport) {
    // Configure a LocalStrategy for username/password authentication
    passport.use(new LocalStrategy({ usernameField: 'username' }, (username, password, done) => {
        // Find the user in the database based on the provided username
        User.findOne({ username: username })
            .then(user => {
                if (!user) {
                    // If user is not found, return an error indicating username not found
                    //   Done Callback takes three parameters: (1) error, (2) user, (3) message
                    return done(null, false, { message: 'Username not found' });
                }

                // Compare the provided password with the hashed password stored in the database
                bcrypt.compare(password, user.password, (error, isMatch) => {
                    if (error) throw error;
                    if (isMatch) {
                        // If the passwords match, return the user object
                        return done(null, user);
                    } else {
                        // If the passwords don't match, return an error indicating incorrect password
                        return done(null, false, { message: 'Password incorrect' });
                    }
                });
            })
            .catch(error => console.log('Error: ', error));
    }));

    // Serialize the user object to store in the session
    passport.serializeUser((user, done) => {
        done(null, user.id);
    });

    // Deserialize the user object from the session
    passport.deserializeUser((id, done) => {
        User.findById(id).exec()
            .then(user => {
                done(null, user);
            })
            .catch(err => {
                done(err, null);
            });
    });
};



// In a typical web app, the credentials are only sent during login. If succeeded, then a session will be established and maintained via a cookie set in the user's browser. Subsequent requests will not contain credentials, but rather the unique cookie that identifies the session. In order to support login sessions, passport will serialize and deserialize the user instances to and from the session.



// function initialize(passport, getUserByUsername, getUserById) {
//     const authenticateUser = async (username, password, done) => {
//         // We will first grab the user
//         const user = getUserByUsername(username);
//         if (!user) {
//             // done will take three parameters: (1) error from the server, (2) user, (3) message
//             return done(null, false, { message: 'No username found' });
//         }

//         try {
//             console.log('password: ', password);
//             console.log('username: ', username);
//             console.log('user password: ', user.password);
//             if (await bcrypt.compare(password, user.password)) {
//                 return done(null, user);
//             } else {
//                 // user password did not match
//                 return done(null, false, { message: 'Password incorrect' });
//             }
//         } catch (error) {
//             return done(error);
//         }
//     };

//     // We will use the local strategy. The first option in LocalStrategy will take in the username (or whatever parameter) and will default the password as a parameter so there's no need to include that. The second parameter is a function, which we named authenticateUser, that will be used to authenticate the user.
//     passport.use(new LocalStrategy({ username: 'username' },
//         authenticateUser));

//     // We will need to serialize the user (to store inside the session) and deserialize (the opposite, to remove the user by its id).
//     passport.serializeUser((user, done) => done(null, user.id));
//     passport.deserializeUser((id, done) => {
//         return done(null, getUserById(id))
//     });
// }

// module.exports = initialize;