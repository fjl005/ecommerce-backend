const jwt = require('jsonwebtoken');
const tokenBlacklist = require('./tokenBlacklist');

const createAccessToken = (user) => {
    // Create your access token using the sign method from jsonwebtoken.
    const accessToken = jwt.sign({ username: user.username, id: user._id },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: '5m' });
    return accessToken;
};

const createRefreshToken = (user) => {
    // Create your access token using the sign method from jsonwebtoken.
    const accessToken = jwt.sign({ username: user.username, id: user._id },
        process.env.REFRESH_TOKEN_SECRET,
        { expiresIn: '1d' });
    return accessToken;
};

// Middlewares usually take three parameters: req, res, next. Next will allow us to move forward with the request.
const validateToken = (req, res, next) => {
    // Accesstoken is stored in the headers, and RefreshToken is stored in the cookie. Remember that for the headers, the access token is in the 'authorization' property, but is stored as 'Bearer {accessToken}'.
    const authHeader = req.headers.authorization;
    const refreshToken = req.cookies['refresh-token'];

    let accessToken;
    if (!authHeader.startsWith('Bearer')) {
        if (!refreshToken) {
            return res.status(401).send('Error: no valid access or refresh token. Please log in.');
        }
    } else {
        accessToken = authHeader.split(' ')[1];
    }

    if (tokenBlacklist.has(accessToken) && tokenBlacklist.has(refreshToken)) {
        return res.status(401).json({ error: 'Invalid access token' });
    }

    try {
        // At this point, let's validate the access and refresh tokens.
        const validatedAccessToken = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET);

        if (validatedAccessToken) {
            console.log('validated access token: ', validatedAccessToken);
            req.authenticated = true;
            return next();
        }
    } catch (accessTokenError) {
        console.log('access token error: ', accessTokenError);

        try {
            const validatedRefreshToken = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
            console.log('validated refresh token: ', validatedRefreshToken);

            const newAccessToken = createAccessToken({ username: validatedRefreshToken.username, _id: validatedRefreshToken.id });

            req.authenticated = true;
            // res.setHeader('Authorization', `Bearer ${newAccessToken}`);
            return res.status(200).json({ accessToken: newAccessToken });
            // return next('route');
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