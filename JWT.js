const jwt = require('jsonwebtoken');
const tokenBlacklist = require('./tokenBlacklist');

const createAccessToken = (user) => {
    // Create your access token using the sign method from jsonwebtoken.
    const accessToken = jwt.sign({ username: user.username, id: user._id },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: '30s' });
    return accessToken;
};

const createRefreshToken = (user) => {
    // Create your access token using the sign method from jsonwebtoken.
    const accessToken = jwt.sign({ username: user.username, id: user._id },
        process.env.REFRESH_TOKEN_SECRET,
        { expiresIn: '7d' });
    return accessToken;
};

// Middlewares usually take three parameters: req, res, next. Next will allow us to move forward with the request.
const validateToken = (req, res, next) => {
    // Accesstoken is stored in the headers, and RefreshToken is stored in the cookie. Remember that for the headers, the access token is in the 'authorization' property, but is stored as 'Bearer {accessToken}'.
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        console.log('auth header: ', authHeader);
        return res.status(401).send('Error: user not authenticated');
    }

    const accessToken = authHeader.split(' ')[1];
    const refreshToken = req.cookies['refresh-token'];

    if (!accessToken && !refreshToken) return res.status(400).send('Error: user not authenticated');

    if (tokenBlacklist.has(accessToken) && tokenBlacklist.has(refreshToken)) return res.status(401).json({ error: 'Invalid access token' });


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

        try {
            const validatedRefreshToken = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
            console.log('validated refresh token: ', validatedRefreshToken);

            const newAccessToken = createAccessToken({ username: validatedRefreshToken.username, _id: validatedRefreshToken.id });

            req.authenticated = true;
            // res.setHeader('Authorization', `Bearer ${newAccessToken}`);
            res.status(200).json({ accessToken: newAccessToken });
            return next('route');
        } catch (refreshTokenError) {
            console.log('Refresh token error: ', refreshTokenError);
            return res.status(400).json({ error: refreshTokenError, message: 'You must log in to access this page' });
        }
    }
}

const requireAuth = (req, res, next) => {
    if (!req.authenticated) {
        return res.status(401).json({ error: 'Unauthorized access' });
    }
    next();
};

module.exports = { createAccessToken, createRefreshToken, validateToken, requireAuth };