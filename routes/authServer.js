require('dotenv').config();
const express = require('express');
const app = express();

const authServer = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Two steps for password hashing:
// (1) create a salt (which gets added to the beginning of the password). New salt is used for every user. This makes our database more secure. Hypothetically, if ten people have the same password, and that password gets hacked, not all ten would be compromised (which would be the case if there was no salt).
// (2) create a hashed password with the salt

const users = [{
    username: 'username',
    password: 'password'
}];

userRouter.get('/', authenticateToken, (req, res) => {
    res.status(200).send('Welcome, logged in user!');
    // res.json(users);
});

userRouter.post('/signup', async (req, res) => {
    try {
        const username = req.body.username;
        const password = req.body.password;

        // genSalt generates the salt. Default parameter is 10. The higher the number, the more secure it will be, but it will take longer. 10 takes a few seconds, but 20-30 can take a few days. Let's just go with the default.
        const salt = await bcrypt.genSalt();

        // Using the second hashedpassword to make coding process easier. Will switch back later.
        // const hashedPassword = await bcrypt.hash(password, salt);
        const hashedPassword = password;


        // The line below combines the two lines above into one. The 10 specifies the number of rounds to create the salt. 
        // const hashedPassword = await bcrypt.hash(password, 10);

        // The salt is automatically stored in the hashedPassword
        const newUser = { username: username, password: hashedPassword };

        if (!username || !password) {
            return res.status(400).send('User and password fields are required');
        }

        users.push(newUser);
        res.status(201).send('User registered successfully');
    } catch (error) {
        console.log('Error: ', error);
        res.status(500).send('Sorry there was an error. Please try again. Make sure you have the username and password both filled out.');
    }
});

userRouter.post('/login', async (req, res) => {
    const user = users.find(user => user.username === req.body.username);
    if (user === null) {
        return res.status(400).send('Cannot find user');
    }

    try {
        if (!req.body.username || !req.body.password) {
            return res.status(400).send('User and password fields are required');
        }

        // Check if the entered password matches the user password found in the Array.find from above.

        // For now, we will proceed with the second if statement so that we don't have to keep using 'signup' to verify the user.
        // if (await bcrypt.compare(req.body.password, user.password)) {
        if (req.body.password === user.password) {

            // we want to serialize the user and in order to do so, we need a separate secret key (which will be taken from our dotenv)

            const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET);
            // In dotenv, we used > require('crypto').randomBytes(64).toString('hex') in our terminal after running node.

            res.status(200).json({ accessToken: accessToken })
            // res.status(200).send('Success');
        } else {
            console.log('user: ', user);
            console.log('req body user: ', req.body.username);
            console.log('req body pw: ', req.body.password);
            console.log('compare (should be true): ', req.body.password === user.password);
            res.send('Not Allowed');
        }
    } catch (error) {
        res.status(500).send('Sorry there was an error. Please try again. Make sure you have the username and password both filled out.');
    }
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

app.listen(4000);

module.exports = userRouter;