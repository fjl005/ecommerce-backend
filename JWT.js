const jwt = require('jsonwebtoken');

const createAccessToken = (user) => {
    // Create your access token using the sign method from jsonwebtoken.
    const accessToken = jwt.sign({ username: user.username, id: user._id },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: '15m' });
    return accessToken;
};

const createRefreshToken = (user) => {
    // Create your access token using the sign method from jsonwebtoken.
    const accessToken = jwt.sign({ username: user.username, id: user._id },
        process.env.REFRESH_TOKEN_SECRET,
        { expiresIn: '1d' });
    return accessToken;
};

const requireAuth = (req, res, next) => {
    if (!req.authenticated) {
        return res.status(401).json({ error: 'Unauthorized access' });
    }
    next();
};

module.exports = { createAccessToken, createRefreshToken, requireAuth };