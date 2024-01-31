const jwt = require('jsonwebtoken');

// Middleware to validate the session
exports.sessionValidation = (req, res, next) => {
    if (!req.session.user) {
        console.log('req session: ', req.session);
        return res.status(400).send('You must log in before accessing this page');
    }

    // Retrieve the session data from mongo db store.
    const store = req.sessionStore; // Access the session store from the request

    // Will use this once I can have cookies set up from the backend without needing to have them set up manually from the frontend.
    store.get(req.session.id, (error, session) => {
        if (error || !session) {
            // We probably won't make it here because of the first if condition for req.session.user.
            return res.status(400).send('You must log in before accessing this page');
        }
        next();
    });
};

// Authorization Middleware -- check for Admin
exports.checkAdmin = (req, res, next) => {
    if (!req.session.user) {
        return res.status(401).send('You are not logged in; and therefore not the admin');
    }

    const store = req.sessionStore;
    store.get(req.session.id, (error, session) => {
        if (error || !session.user.admin) {
            return res.status(403).send('You are not the admin!');
        }
        next();
    });
};

// Validate JWT Token -- not really used because I transitioned to using Sessions instead. 
exports.validateToken = (req, res, next) => {
    // Accesstoken is stored in the headers, and RefreshToken is stored in the cookie. Remember that for the headers, the access token is in the 'authorization' property, but is stored as 'Bearer {accessToken}'.
    const authHeader = req.headers.authorization;
    console.log(authHeader)

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        console.log('auth header: ', authHeader);
        return res.status(401).send('Error: user not authenticated');
    }

    const accessToken = authHeader.split(' ')[1];
    // const refreshToken = req.cookies['refresh-token'];

    if (!accessToken) return res.status(400).send('Error: user not authenticated');

    try {
        const validatedAccessToken = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET);

        if (validatedAccessToken) {
            console.log('validated access token: ', validatedAccessToken);
        }
        // The verify method will return the decoded token. If invalid, then it will throw an error, which will be handled in our catch.

        // Otherwise, if we reach this point, then the access token is valid and has not expired. proceed to authenticate. 
        req.authenticated = true;
        return next();

    } catch (accessTokenError) {
        console.log('access token error: ', accessTokenError);
        res.status(400).send('sorry your token expired');

        // Again, no refresh token is used because of lack of https. Without HTTPS, I can't send the browser's cookie data to the backend. It's also not safe to store a refresh token in JS.
        // try {
        //     const validatedRefreshToken = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
        //     console.log('validated refresh token: ', validatedRefreshToken);

        //     const newAccessToken = createAccessToken({ username: validatedRefreshToken.username, _id: validatedRefreshToken.id });

        //     req.authenticated = true;
        //     // res.setHeader('Authorization', `Bearer ${newAccessToken}`);
        //     res.status(200).json({ accessToken: newAccessToken });
        //     return next('route');
        // } catch (refreshTokenError) {
        //     console.log('Refresh token error: ', refreshTokenError);
        //     return res.status(400).json({ error: refreshTokenError, message: 'You must log in to access this page' });
        // }
    }

};