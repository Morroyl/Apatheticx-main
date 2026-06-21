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

// директор или администратор
function isDirector(req, res, next) {
    if (req.session.user && (req.session.user.role === 'director' || req.session.user.role === 'admin')) {
        return next();
    }
    res.status(403).json({ error: 'Доступ запрещён. Требуется роль директора или администратора.' });
}

// Только администратор
function isAdmin(req, res, next) {
    if (req.session.user && req.session.user.role === 'admin') {
        return next();
    }
    res.status(403).json({ error: 'Доступ запрещён. Требуется роль администратора.' });
}

function isManagerOrDirector(req, res, next) {
    if (req.session.user && (req.session.user.role === 'manager' || req.session.user.role === 'director' || req.session.user.role === 'admin')) {
        return next();
    }
    res.status(403).json({ error: 'Доступ запрещён. Требуется роль менеджера, директора или администратора.' });
}

module.exports = { isManager, isClient, hasRole, isDirector, isAdmin, isManagerOrDirector };