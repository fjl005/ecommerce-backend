require('dotenv').config();
const express = require('express');
const app = express();

const userRouter = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const User = require('../models/User');
const { createAccessToken, createRefreshToken } = require('../JWT');

// Configure passport by first importing the middleware, then passing it as a parameter into my passport-config file.
const passport = require('passport');
require('../passport-config')(passport);

// Import token blacklist
const tokenBlacklist = require('../tokenBlacklist');

userRouter.get('/', (req, res) => {
    res.status(200).send('Please Log In');
});

userRouter.post('/signup', async (req, res) => {
    const { username, password } = req.body;
    if (password.length < 6) {
        return res.status(400).send('Password less than 6 characters');
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
        console.log('Error: ', error);
        res.status(500).send('Sorry there was an error. Please try again. Make sure you have the username and password both filled out.');
    }
});

userRouter.post('/login', (req, res, next) => {
    // Passport.authenticate will trigger the authentication process that was configured in passport-config. This is because we imported passport, then configured the passport middleware to the passport-config file. 
    passport.authenticate('local', (err, user, info) => {
        // (err, user, info) => is the callback function that's run after the authentication process. 
        // (1) Err, for any error that occurred during authentication, (2) user, the authenticated user assuming success, and (3) info, providing additional info about the authentication process. 
        if (err) {
            return res.status(500).send('An error occurred during authentication');
        }
        if (!user) {
            return res.status(401).send('Invalid username or password');
        }

        // If the authentication is successful, generate the JWT tokens
        const accessToken = createAccessToken(user);
        const refreshToken = createRefreshToken(user);

        // Instead of storing the access/refresh tokens in the cookie, store them in the header.
        res.setHeader('Authorization', `Bearer ${accessToken}`)
        res.cookie('refresh-token', refreshToken, {
            httpOnly: true,
            // secure: process.env.NODE_ENV === 'production', // Set to true in production
        });

        // Redirect or send a response indicating successful login
        // res.redirect('/');
        res.status(200).json({ message: 'user logged in!', accessToken: accessToken });
    })(req, res, next);
});

userRouter.get('/logout', (req, res) => {
    const accessToken = req.headers.authorization.split(' ')[1];
    const refreshToken = req.cookies['refresh-token'];

    if (tokenBlacklist.has(accessToken) && tokenBlacklist.has(refreshToken)) return res.status(401).send('Already logged out, or you were never logged in.');

    // Add tokens to the blacklist
    tokenBlacklist.add(accessToken);
    tokenBlacklist.add(refreshToken);

    console.log('token black list: ', tokenBlacklist);
    console.log('access token: ', accessToken);
    console.log('refresh token: ', refreshToken);

    // Clear the cookies or remove the tokens from local storage on the client side
    if (!accessToken && !refreshToken) return res.status(401).send('Already logged out; you were never signed in');
    res.status(200).json({ message: 'Logged out successfully' });
});



//     const reqUsername = req.body.username;
//     const reqPassword = req.body.password;

//     if (!reqUsername || !reqPassword) {
//         return res.status(400).send('User and password fields are required.');
//     }

//     try {
//         const user = await User.findOne({ username: reqUsername });

//         if (!user) {
//             return res.status(400).send('User does not exist');
//         }

//         const dbPassword = user.password;
//         console.log('req password: ', reqPassword);
//         console.log('db password: ', dbPassword);

//         bcrypt.compare(reqPassword, dbPassword)
//             .then((match) => {
//                 if (!match) {
//                     // The callback function returns a variable, named 'match', that will be true if matched.
//                     return res.status(400).send('Wrong username and password combination');
//                 } else {
//                     const accessToken = createTokens(user);
//                     res.cookie('access-token', accessToken, {
//                         // It accepts time in milliseconds. So the below should be for 30 days.
//                         maxAge: 60 * 60 * 24 * 30 * 1000,
//                         httpOnly: true,
//                     });
//                     return res.send('Logged in');
//                 }
//             })
//     } catch (error) {
//         res.status(500).send('Sorry there was an error. Please try again. Make sure you have the username and password both filled out.');
//     }
// });

userRouter.delete('/', async (req, res) => {
    User.deleteMany({})
        .then(() => {
            console.log('All documents deleted successfully');
            res.status(200).send('ALl user data deleted');
        })
        .catch(error => {
            console.error('Error deleting documents:', error);
            res.status(400).send('There was an error in deleting the user data');
        });
});

function authenticateToken(req, res, next) {
    // We want to access the token, which can be taken from the 'authorization' header.
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    // Bearer TOKEN, token is the second one.

    if (token === null) return res.sendStatus(401).send('No Token');

    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
        // The callback will take an error and the user that we serialized.
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
        // Next allows us to move on to the next middleware
    })
}

module.exports = userRouter;