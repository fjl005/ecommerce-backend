const jwt = require('jsonwebtoken');

const createAccessToken = (user) => {
    // Create your access token using the sign method from jsonwebtoken.
    const accessToken = jwt.sign({ username: user.username, id: user._id },
        process.env.ACCESS_TOKEN_SECRET);
    return accessToken;
};

const createRefreshToken = (user) => {
    // Create your access token using the sign method from jsonwebtoken.
    const accessToken = jwt.sign({ username: user.username, id: user._id },
        process.env.REFRESH_TOKEN_SECRET);
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

    try {
        // The verify method will return the decoded token. If invalid, then it will throw an error, which will be handled in our catch.
        const validAccessToken = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET);

        // Check if the access token is expired. Date.now() is the current time in milliseconds. 
        if (validAccessToken.exp < Date.now() / 1000) {
            const validateRefreshToken = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);

            // If the refresh token is valid, then create a new access token and proceed with authentication.
            if (validateRefreshToken) {
                const newAccessToken = createAccessToken({ username: validateRefreshToken.username, _id: validateRefreshToken.id });

                // Set the new access token in the response headers or cookies
                res.cookie('access-token', newAccessToken, {
                    maxAge: 60 * 60 * 1000, // 1 hour
                    httpOnly: true,
                });

                req.authenticated = true; // Set the authenticated property in the request
                return next();
            }
        }

        // Otherwise, if we reach this point, then the access token is valid and has not expired. proceed to authenticate. 
        req.authenticated = true;
        return next();

    } catch (error) { return res.status(400).json({ error: error }) }
}

module.exports = { createAccessToken, createRefreshToken, validateToken };