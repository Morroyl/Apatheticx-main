function isAuthenticated(req, res, next) {
    if (req.session.user) {
        return next();
    }
    res.status(401).json({ error: 'Не авторизован' });
}

function isManager(req, res, next) {
    if (req.session.user && req.session.user.role === 'manager') {
        return next();
    }
    res.status(403).json({ error: 'Доступ запрещён' });
}

module.exports = { isAuthenticated, isManager };