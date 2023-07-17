// Middleware to validate the session
const sessionValidation = (req, res, next) => {
    // Check if the user's session exists and contains user data (e.g., req.session.user)
    if (req.session.user) {
        // The session is valid, so allow the user to proceed
        next();
    } else {
        // The session is invalid or not present, so redirect the user to the login page
        res.status(400).send('You must log in before accessing this page');
    }
};

module.exports = sessionValidation;