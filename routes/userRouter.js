const express = require('express');
const userRouter = express.Router();
const bcrypt = require('bcrypt');

// Two steps for password hashing:
// (1) create a salt (which gets added to the beginning of the password). New salt is used for every user. This makes our database more secure. Hypothetically, if ten people have the same password, and that password gets hacked, not all ten would be compromised (which would be the case if there was no salt).
// (2) create a hashed password with the salt

const users = [];

userRouter.get('/', (req, res) => {
    res.json(users);
});

userRouter.post('/signup', async (req, res) => {
    try {
        const username = req.body.username;
        const password = req.body.password;

        // genSalt generates the salt. Default parameter is 10. The higher the number, the more secure it will be, but it will take longer. 10 takes a few seconds, but 20-30 can take a few days. Let's just go with the default.
        const salt = await bcrypt.genSalt();
        const hashedPassword = await bcrypt.hash(password, salt);

        // The line below combines the two lines above into one. The 10 specifies the number of rounds to create the salt. 
        // const hashedPassword = await bcrypt.hash(password, 10);

        // The salt is automatically stored in the hashedPassword
        const newUser = { username: username, password: hashedPassword };

        if (!username || !password) {
            return res.status(400).send('User and password fields are required');
        }

        console.log(`User: ${username}, Password: ${hashedPassword}`);
        users.push(newUser);
        res.status(201).send('User registered successfully');
    } catch (error) {
        console.log('Error: ', error);
        res.status(500).send('Sorry there was an error. Please try again.');
    }
});

userRouter.post('/login', async (req, res) => {
    const user = users.find(user => user.username === req.body.username);
    if (user === null) {
        return res.status(400).send('Cannot find user');
    }

    try {
        // Check if the entered password matches the user password found in the Array.find from above.
        console.log('users username: ', user.username);
        console.log('users password: ', user.password);
        console.log('req body username: ', req.body.username);
        console.log('req body password: ', req.body.password);


        if (await bcrypt.compare(req.body.password, user.password)) {
            res.status(200).send('Success');
        } else {
            res.send('Not Allowed');
        }
    } catch (error) {
        console.log('users: ', users);
        console.log('users username: ', user.username);
        console.log('users password: ', user.password);
        console.log('req body username: ', req.body.username);
        console.log('req body password: ', req.body.password);

        res.status(500).send('Sorry there is some error');
    }
});

module.exports = userRouter;