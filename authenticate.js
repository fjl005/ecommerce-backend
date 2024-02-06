const jwt = require('jsonwebtoken');

// Middleware to validate the session
exports.sessionValidation = (req, res, next) => {
    if (!req.session.user) {
        return res.status(400).send('You must log in before accessing this page');
    }

    const store = req.sessionStore;

    store.get(req.session.id, (error, session) => {
        if (error || !session) {
            return res.status(400).send('You must log in before accessing this page');
        }
        next();
    });
};

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

// exports.validateToken = (req, res, next) => {
//     const authHeader = req.headers.authorization;

//     if (!authHeader || !authHeader.startsWith('Bearer ')) {
//         return res.status(401).send('Error: user not authenticated');
//     }

//     const accessToken = authHeader.split(' ')[1];
//     if (!accessToken) return res.status(400).send('Error: user not authenticated');

//     try {
//         const validatedAccessToken = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET);

//         if (validatedAccessToken) {
//             console.log('validated access token: ', validatedAccessToken);
//         }
//         req.authenticated = true;
//         return next();

//     } catch (accessTokenError) {
//         console.log('access token error: ', accessTokenError);
//         res.status(400).send('sorry your token expired');

//         // Again, no refresh token is used because of lack of https. Without HTTPS, I can't send the browser's cookie data to the backend. It's also not safe to store a refresh token in JS.
//         // try {
//         //     const validatedRefreshToken = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
//         //     console.log('validated refresh token: ', validatedRefreshToken);

//         //     const newAccessToken = createAccessToken({ username: validatedRefreshToken.username, _id: validatedRefreshToken.id });

//         //     req.authenticated = true;
//         //     // res.setHeader('Authorization', `Bearer ${newAccessToken}`);
//         //     res.status(200).json({ accessToken: newAccessToken });
//         //     return next('route');
//         // } catch (refreshTokenError) {
//         //     console.log('Refresh token error: ', refreshTokenError);
//         //     return res.status(400).json({ error: refreshTokenError, message: 'You must log in to access this page' });
//         // }
//     }

// };