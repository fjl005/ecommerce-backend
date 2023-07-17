require('dotenv').config();
const passport = require('../passport-config');
const express = require('express');
const userRouter = express.Router();
const bcrypt = require('bcrypt');
const User = require('../models/User');


userRouter.get('/', (req, res) => {
    res.status(200).send('Please Log In');
});

userRouter.post('/signup', async (req, res) => {
    const { username, password } = req.body;
    if (password.length < 6) {
        return res.status(400).send('Password needs to be more than 6 characters');
    }

    try {
        if (!username || !password) {
            return res.status(400).send('User and password fields are required');
        }
        // genSalt generates the salt. Default parameter is 10. The higher the number, the more secure it will be, but it will take longer. 10 takes a few seconds, but 20-30 can take a few days. Let's just go with the default. The salt will be automatically stored in the hashedPassword
        const salt = await bcrypt.genSalt();
        const hashedPassword = await bcrypt.hash(password, salt);

        // The line below combines the two lines above into one. The 10 specifies the number of rounds to create the salt. 
        // const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = { username: username, password: hashedPassword };

        User.create(newUser)
            .then(() => {
                return res.json('User Registered!');
            }).catch((err) => {
                if (err.code = 11000) {
                    return res.status(400).send('The username already exists');
                }
                return res.status(400).json({ error: err })
            })
    } catch (error) {
        res.status(500).send('Sorry there was an error. Please try again. Make sure you have the username and password both filled out.');
    }
});

userRouter.get('/login', (req, res) => {
    if (req.session.user) {
        return res.send('You are already signed in');
    }
    res.send('Login page');
});

userRouter.post('/login', (req, res, next) => {
    passport.authenticate('local', (err, user, info) => {
        /* (err, user, info) => is the callback function that's run after the authentication process. 
        
        (1) Err, for any error that occurred during authentication, 
        (2) user, the authenticated user assuming success, and 
        (3) info, providing additional info about the authentication process. */
        if (err) {
            return res.status(500).send('An error occurred during authentication');
        }
        if (!user) {
            return res.status(401).send('Invalid username or password');
        }

        // If authentication is successful, regenerate the session ID (recommended for security). So if a user logs out and logs back in, the session ID will be different.
        req.session.regenerate((error) => {
            if (error) {
                return res.status(500).send('An error occurred during session regeneration');
            }

            // Set user object in the session data
            req.session.user = {
                username: user.username,
                isLoggedIn: true,
                _id: user._id, // Assuming you have a unique identifier for the user in your MongoDB User model
            };
            res.status(200).json({ message: 'user logged in!', user: req.session.user });
        })
    })(req, res, next);
    // I include (req, res, next) at the end to invoke the passport middleware. Without it, I am simply returning the middleware function without invoking it. 
});

userRouter.route('/logout').get(performLogout).post(performLogout).delete(performLogout);

function performLogout(req, res) {

    if (!req.cookies['connect.sid']) {
        return res.status(200).send('User already logged out');
    }

    res.clearCookie('connect.sid');

    req.session.destroy((err) => {
        if (err) {
            console.error('Error destroying session:', err);
            return res.status(500).json({ error: 'Internal server error' });
        }

        return res.status(200).json({ message: 'Logged out successfully' });
    });
}

// THE BELOW WILL NEED TO BE USED FOR ADMIN, WILL NEED TO UPDATE USER AUTHORIZATION SOON!!!
// userRouter.delete('/', async (req, res) => {
//     User.deleteMany({})
//         .then(() => {
//             console.log('All documents deleted successfully');
//             res.status(200).send('ALl user data deleted');
//         })
//         .catch(error => {
//             console.error('Error deleting documents:', error);
//             res.status(400).send('There was an error in deleting the user data');
//         });
// });

module.exports = userRouter;