require('dotenv').config();
const passport = require('../passport-config');
const express = require('express');
const userRouter = express.Router();
const bcrypt = require('bcrypt');
const User = require('../models/User');
const authenticate = require('../authenticate');


userRouter.get('/', authenticate.sessionValidation, (req, res) => {
    res.status(200).json({
        message: 'User Info listed down below',
        username: req.session.user.username,
        userID: req.session.user._id,
        admin: req.session.user.admin
    })
});

userRouter.post('/updateUsername', authenticate.sessionValidation, async (req, res) => {
    const newUsername = req.body.newUsername;
    const currentUsername = req.session.user.username;

    try {
        const usernameInDB = await User.findOne({ username: newUsername });

        if (usernameInDB) {
            return res.status(400).send('Username already exists');
        }

        const user = await User.findOne({ username: currentUsername });

        if (!user) {
            return res.status(404).send('User not found');
        }

        user.username = newUsername;
        await user.save();

        req.session.user.username = newUsername;

        res.status(200).json({
            message: 'Username updated successfully',
            userInfo: user,
            newSessionInfo: req.session.user
        });

    } catch (error) {
        console.log('error with post (/users/updateUsername)', error);
    }

});

userRouter.post('/updatePassword', authenticate.sessionValidation, async (req, res) => {
    const { username, password, newPW, reEnterPW } = req.body;

    // First, check if the new passwords match
    if (newPW !== reEnterPW) {
        return res.status(401).send('New passwords do not match');
    }

    if (password === newPW) {
        return res.status(401).send('Cannot use same password');
    }

    // Function to update the password
    const updatePassword = async (username, newPassword) => {
        try {
            const salt = await bcrypt.genSalt();
            const hashedPassword = await bcrypt.hash(newPassword, salt);
            const currentUser = await User.findOne({ username });

            if (!currentUser) {
                return res.status(404).send('User not found');
            }

            currentUser.password = hashedPassword;
            await currentUser.save();

            return currentUser;
        } catch (error) {
            console.log('error in updatePassword() in userRouter .post/updatePassword: ', error);
        }
    };

    passport.authenticate('local', async (err, user, info) => {
        if (err) {
            return res.status(500).send('An error occurred during authentication');
        }
        if (!user) {
            return res.status(401).send('Invalid password');
        }

        try {
            const updatedUser = await updatePassword(username, newPW);
            res.status(200).json({
                message: 'Password updated successfully',
                userInfo: updatedUser,
            });
        } catch (error) {
            console.log('Error updating password: ', error);
            res.status(500).send('An error occurred while updating the password');
        }
    })(req, res);
});

userRouter.post('/signup', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).send('User and password fields are both required');
    }

    if (password.length < 6) {
        return res.status(400).send('Password needs to be more than 6 characters');
    }
    try {
        // genSalt generates the salt. Default parameter is 10. The higher the number, the more secure it will be, but it will take longer. 10 takes a few seconds, but 20-30 can take a few days. Let's just go with the default. The salt will be automatically stored in the hashedPassword
        const salt = await bcrypt.genSalt();
        const hashedPassword = await bcrypt.hash(password, salt);

        // The line below combines the two lines above into one. The 10 specifies the number of rounds to create the salt. 
        // const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = { username: username, password: hashedPassword };

        await User.create(newUser);
        return res.json('User Registered!');
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).send('The username already exists');
        }
        return res.status(400).json({ error: err });
    }
});

userRouter.get('/login', (req, res) => {
    if (req.session.user) {
        return res.send(`You are already signed in as: ${req.session.user.username}`);
    }
    res.send('Login page');
});

// FOR JWT
// userRouter.post('/login', (req, res, next) => {
//     // Passport.authenticate will trigger the authentication process that was configured in passport-config. This is because we imported passport, then configured the passport middleware to the passport-config file. 
//     passport.authenticate('local', (err, user, info) => {
//         // (err, user, info) => is the callback function that's run after the authentication process. 
//         // (1) Err, for any error that occurred during authentication, (2) user, the authenticated user assuming success, and (3) info, providing additional info about the authentication process. 
//         if (err) {
//             return res.status(500).send('An error occurred during authentication');
//         }
//         if (!user) {
//             return res.status(401).send('Invalid username or password');
//         }

//         // If the authentication is successful, generate the JWT tokens
//         const accessToken = jwtFile.createAccessToken(user);
//         res.setHeader('Authorization', `Bearer ${accessToken}`);

//         // Refresh token not used because I can't store in the browser's cookie. I can't store in the browser's cookie because I can't send the cookie data without https.
//         // const refreshToken = jwtFile.createRefreshToken(user);
//         // res.cookie('refresh-token', refreshToken, {
//         //     httpOnly: true,
//         // });
//         res.status(200).json({ message: 'user logged in!', accessToken: accessToken });
//     })(req, res, next);
// });

// For SESSION
userRouter.post('/login', (req, res, next) => {
    if (req.session.user) {
        return res.send(`You are already signed in as: ${req.session.user.username}`);
    }

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
                admin: user.admin,
                _id: user._id,
                cart: user.cart,
                saved: user.saved,
                orders: user.orders
            };

            // I don't think the res.cookie is working right now. Will need to figure this out eventually. For now, I am manually creating the cookie on the client side
            res.status(200).json({ message: 'user logged in!', user: req.session.user, sessionId: req.session.id });
        });
    })(req, res, next);
    // I include (req, res, next) at the end to invoke the passport middleware. Without it, I am simply returning the middleware function without invoking it. 
});

userRouter.route('/logout').get(performLogout).post(performLogout).delete(performLogout);

function performLogout(req, res) {

    if (!req.session.user) {
        return res.status(200).send('User already logged out');
    }

    // Clear the session cookie on the client-side
    res.clearCookie('connect.sid');

    // Destroy the session data on the server-side
    req.session.destroy((err) => {
        if (err) {
            console.error('Error destroying session:', err);
            return res.status(500).json({ error: 'Internal server error' });
        }

        return res.status(200).json({ message: 'Logged out successfully' });
    });
}

userRouter.post('/admin', authenticate.checkAdmin, (req, res) => {
    res.send('You are the admin!');
});

// THE BELOW WILL NEED TO BE USED FOR ADMIN, WILL NEED TO UPDATE USER AUTHORIZATION SOON!!!
userRouter.delete('/', authenticate.checkAdmin, async (req, res) => {
    try {
        // Find all non-admin users
        const nonAdminUsers = await User.find({ admin: false });

        // Delete each non-admin user one by one
        for (const user of nonAdminUsers) {
            await user.deleteOne();
        }

        res.json({ message: 'Non-admin users deleted successfully.' })
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'An error occurred while deleting non-admin users' });
    }
});

userRouter.delete('/:username', authenticate.sessionValidation, async (req, res) => {
    try {
        // const userIdToDelete = req.params.id;
        const userIdToDelete = req.session.user._id.toString();

        // Find the user by ID
        const userToDelete = await User.findById(userIdToDelete);

        if (!userToDelete) {
            return res.status(404).json({ error: 'User not found.' });
        }

        // Check if the user to be deleted is an admin
        if (userToDelete.admin) {
            return res.status(403).json({ error: 'Admin users cannot be deleted.' });
        }

        // If the user is not an admin, proceed with deletion
        await userToDelete.deleteOne();

        res.json({ message: 'User deleted successfully.' });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});


module.exports = userRouter;