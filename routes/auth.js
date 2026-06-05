const express = require('express');
const bcrypt = require('bcrypt');
const { query, run } = require('../models/db');
const { isAuthenticated } = require('../middlewares/authMiddleware');
const router = express.Router();

// Регистрация
router.post('/register', async (req, res) => {
    const { fullName, email, phone, password } = req.body;
    try {
        const existing = await query('SELECT * FROM Users WHERE email = ?', [email]);
        if (existing.length > 0) {
            return res.status(400).json({ error: 'Email уже зарегистрирован' });
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ error: 'Некорректный формат email' });
        }
        const nameRegex = /^[А-ЯЁ][а-яё]+(?:-[А-ЯЁ][а-яё]+)?\s+[А-ЯЁ][а-яё]+(?:-[А-ЯЁ][а-яё]+)?(?:\s+[А-ЯЁ][а-яё]+(?:-[А-ЯЁ][а-яё]+)?)?$/;
        if (!fullName || !nameRegex.test(fullName.trim())) {
            return res.status(400).json({ error: 'Введите имя и фамилию с заглавных букв (например, Иван Иванов)' });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        await run(
            `INSERT INTO Users (fullName, email, phone, passwordHash, role) VALUES (?, ?, ?, ?, 'client')`,
            [fullName.trim(), email, phone, hashedPassword]
        );
        res.status(201).json({ message: 'Регистрация успешна' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// Вход
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const users = await query('SELECT * FROM Users WHERE email = ?', [email]);
        if (users.length === 0) {
            return res.status(401).json({ error: 'Неверный email или пароль' });
        }
        const user = users[0];
        const match = await bcrypt.compare(password, user.passwordHash);
        if (!match) {
            return res.status(401).json({ error: 'Неверный email или пароль' });
        }

        req.session.user = {
            id: user.id,
            fullName: user.fullName,
            email: user.email,
            role: user.role
        };

        // Определяем URL для редиректа в зависимости от роли
        let redirectUrl = '/dashboard';
        if (user.role === 'manager') redirectUrl = '/manager-panel';
        else if (user.role === 'director' || user.role === 'admin') redirectUrl = '/director-panel';

        res.json({ role: user.role, redirectUrl });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// Выход
router.post('/logout', (req, res) => {
    req.session.destroy();
    res.json({ message: 'Выход выполнен' });
});

// Текущий пользователь
router.get('/me', async (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ error: 'Не авторизован' });
    }
    try {
        const users = await query(
            'SELECT id, fullName, email, phone, role FROM Users WHERE id = ?',
            [req.session.user.id]
        );
        if (users.length === 0) {
            return res.status(401).json({ error: 'Пользователь не найден' });
        }
        res.json(users[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// Обновление профиля (имя)
router.put('/profile', isAuthenticated, async (req, res) => {
    const userId = req.session.user.id;
    const { fullName } = req.body;

    const nameRegex = /^[А-ЯЁ][а-яё]+(?:-[А-ЯЁ][а-яё]+)?\s+[А-ЯЁ][а-яё]+(?:-[А-ЯЁ][а-яё]+)?(?:\s+[А-ЯЁ][а-яё]+(?:-[А-ЯЁ][а-яё]+)?)?$/;
    if (!fullName || !nameRegex.test(fullName.trim())) {
        return res.status(400).json({ error: 'Введите имя и фамилию с заглавных букв (например, Иван Иванов)' });
    }

    try {
        await run(
            'UPDATE Users SET fullName = ? WHERE id = ?',
            [fullName.trim(), userId]
        );
        req.session.user.fullName = fullName.trim();
        res.json({ message: 'Профиль обновлён' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// Смена пароля
router.put('/password', isAuthenticated, async (req, res) => {
    const userId = req.session.user.id;
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
        return res.status(400).json({ error: 'Укажите старый и новый пароль' });
    }
    if (newPassword.length < 6) {
        return res.status(400).json({ error: 'Новый пароль должен содержать минимум 6 символов' });
    }
    if (oldPassword === newPassword) {
        return res.status(400).json({ error: 'Новый пароль должен отличаться от текущего' });
    }

    try {
        const users = await query('SELECT passwordHash FROM Users WHERE id = ?', [userId]);
        if (users.length === 0) {
            return res.status(404).json({ error: 'Пользователь не найден' });
        }
        const valid = await bcrypt.compare(oldPassword, users[0].passwordHash);
        if (!valid) {
            return res.status(400).json({ error: 'Неверный текущий пароль' });
        }

        const hashed = await bcrypt.hash(newPassword, 10);
        await run('UPDATE Users SET passwordHash = ? WHERE id = ?', [hashed, userId]);
        res.json({ message: 'Пароль успешно изменён' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

module.exports = router;