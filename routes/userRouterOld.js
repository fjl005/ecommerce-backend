require('dotenv').config();
const express = require('express');
const app = express();
const userRouter = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { createTokens, validateToken } = require('../JWT');
const flash = require('express-flash');
const session = require('express-session');

// passport config
const passport = require('passport');
require('../passport-config')(passport);

// const initializePassport = require('../passport-config');
// initializePassport(passport,
//     async (username) => await User.findOne({ username: username }),
//     async (id) => await User.findById(id));
// InitializePassport takes three parameters, which are defined back in passport-config. 
// (1) passport, (2) getUserByUsername function, (3) getUserById function


// Two steps for password hashing:
// (1) create a salt (which gets added to the beginning of the password). New salt is used for every user. This makes our database more secure. Hypothetically, if ten people have the same password, and that password gets hacked, not all ten would be compromised (which would be the case if there was no salt).
// (2) create a hashed password with the salt

// userRouter.get('/', validateToken, (req, res) => {
//     res.status(200).send('Welcome, logged in user!');
// });

userRouter.get('/', passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/login',
    failureFlash: true
}));

userRouter.post('/signup', async (req, res) => {
    try {
        const username = req.body.username;
        const password = req.body.password;

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

userRouter.post('/login', passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/users/login/redirect',
    failureFlash: true
}));

userRouter.get('/login/redirect', (req, res) => {
    res.status(400).send('error please try again');
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