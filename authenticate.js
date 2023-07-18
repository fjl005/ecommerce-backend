// Middleware to validate the session
exports.sessionValidation = (req, res, next) => {
    // Check if the user's session exists and contains user data (e.g., req.session.user)
    if (req.session.user) {
        // The session is valid, so allow the user to proceed
        next();
    } else {
        // The session is invalid or not present, so redirect the user to the login page
        res.status(400).send('You must log in before accessing this page');
    }
};

// Authorization Middleware -- check for Admin
exports.checkAdmin = (req, res, next) => {
    if (req.session.user && req.session.user.admin) {
        next();
    } else {
        res.status(403).json({ error: 'Forbidden, Admin Access Required' });
    }
};