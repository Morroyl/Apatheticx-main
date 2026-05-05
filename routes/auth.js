const express = require('express');
const bcrypt = require('bcrypt');
const { query, run } = require('../models/db');
const router = express.Router();

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

        const hashedPassword = await bcrypt.hash(password, 10);
        await run(
            `INSERT INTO Users (fullName, email, phone, passwordHash, role) VALUES (?, ?, ?, ?, 'client')`,
            [fullName, email, phone, hashedPassword]
        );
        res.status(201).json({ message: 'Регистрация успешна' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

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
        res.json({ role: user.role });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

router.post('/logout', (req, res) => {
    req.session.destroy();
    res.json({ message: 'Выход выполнен' });
});

router.get('/me', (req, res) => {
    if (req.session.user) {
        res.json(req.session.user);
    } else {
        res.status(401).json({ error: 'Не авторизован' });
    }
});

module.exports = router;