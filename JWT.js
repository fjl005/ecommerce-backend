const { sign, verify } = require('jsonwebtoken');

const createTokens = (user) => {
    // Create your access token.
    const accessToken = sign({ username: user.username, id: user._id },
        process.env.ACCESS_TOKEN_SECRET);
    return accessToken;
};

// Middlewares usually take three parameters: req, res, next. Next will allow us to move forward with the request.
const validateToken = (req, res, next) => {
    //  grab the cookie via req, and use the name of it as defined in userRouter
    const accessToken = req.cookies['access-token'];

    if (!accessToken) return res.status(400).send('Error: user not authenticated');

    try {
        // The verify method will return a boolean value.
        const validToken = verify(accessToken, process.env.ACCESS_TOKEN_SECRET);
        if (validToken) {
            // We'll create an authenticated property in the req to true, to keep track of authentication.
            req.authenticated = true;
            return next();
        }
    } catch (error) { return res.status(400).json({ error: error }) }
}

module.exports = { createTokens, validateToken };