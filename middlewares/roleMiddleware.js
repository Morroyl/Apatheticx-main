function isManager(req, res, next) {
    if (req.session.user && req.session.user.role === 'manager') {
        return next();
    }
    res.status(403).json({ error: 'Доступ запрещён. Требуется роль менеджера.' });
}

function isClient(req, res, next) {
    if (req.session.user && req.session.user.role === 'client') {
        return next();
    }
    res.status(403).json({ error: 'Доступ запрещён. Требуется роль клиента.' });
}

function hasRole(allowedRoles) {
    return (req, res, next) => {
        if (req.session.user && allowedRoles.includes(req.session.user.role)) {
            return next();
        }
        res.status(403).json({ error: 'Недостаточно прав' });
    };
}

function isDirector(req, res, next) {
    if (req.session.user && req.session.user.role === 'director') {
        return next();
    }
    res.status(403).json({ error: 'Доступ запрещён. Требуется роль директора.' });
}

function isManagerOrDirector(req, res, next) {
    if (req.session.user && (req.session.user.role === 'manager' || req.session.user.role === 'director')) {
        return next();
    }
    res.status(403).json({ error: 'Доступ запрещён. Требуется роль менеджера или директора.' });
}

module.exports = { isManager, isClient, hasRole, isDirector, isManagerOrDirector };