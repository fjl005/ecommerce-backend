// Authorization Middleware -- check for Admin
const checkAdmin = (req, res, next) => {
    if (req.session.user.admin) {
        next();
    } else {
        res.status(403).json({ error: 'Forbidden, Admin Access Required' });
    }
}

module.exports = checkAdmin;