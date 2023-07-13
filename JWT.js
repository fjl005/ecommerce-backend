const { sign, verify } = require('jsonwebtoken');

const createTokens = (user) => {
    // Create your access token.
    const accessToken = sign({ username: user.username, id: user._id },
        process.env.ACCESS_TOKEN_SECRET);
    return accessToken;
};

module.exports = { createTokens };