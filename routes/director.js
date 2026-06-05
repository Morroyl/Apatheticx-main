const express = require('express');
const { query, run } = require('../models/db');
const { isDirector, isAdmin } = require('../middlewares/roleMiddleware');
const bcrypt = require('bcrypt');
const router = express.Router();

// ---------- СКЛАДЫ (доступ: директор или администратор) ----------
router.get('/warehouses', isDirector, async (req, res) => {
    try {
        const warehouses = await query('SELECT * FROM Warehouses ORDER BY category, name');
        res.json(warehouses);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

router.post('/warehouses', isDirector, async (req, res) => {
    const { name, description, address, area, pricePerMonth, category, imageUrl } = req.body;
    if (!name || !address || !area || !pricePerMonth) {
        return res.status(400).json({ error: 'Название, адрес, площадь и цена обязательны' });
    }
    try {
        const result = await run(
            `INSERT INTO Warehouses (name, description, address, area, pricePerMonth, category, imageUrl)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [name, description, address, area, pricePerMonth, category, imageUrl || null]
        );
        res.status(201).json({ id: result.id, message: 'Склад добавлен' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

router.put('/warehouses/:id', isDirector, async (req, res) => {
    const { id } = req.params;
    const { name, description, address, area, pricePerMonth, category, imageUrl } = req.body;
    try {
        await run(
            `UPDATE Warehouses SET name = ?, description = ?, address = ?,
                area = ?, pricePerMonth = ?, category = ?, imageUrl = ? WHERE id = ?`,
            [name, description, address, area, pricePerMonth, category, imageUrl || null, id]
        );
        res.json({ message: 'Склад обновлён' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

router.delete('/warehouses/:id', isDirector, async (req, res) => {
    const { id } = req.params;
    try {
        await run('DELETE FROM Warehouses WHERE id = ?', [id]);
        res.json({ message: 'Склад удалён' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// ---------- ПОЛЬЗОВАТЕЛИ ----------
router.get('/users', isDirector, async (req, res) => {
    try {
        let sql = `SELECT id, fullName, email, phone, role, createdAt FROM Users`;
        const params = [];
        const { search } = req.query;
        if (search) {
            sql += ` WHERE phone LIKE ?`;
            params.push(`%${search}%`);
        }
        sql += ` ORDER BY createdAt DESC`;
        const users = await query(sql, params);
        res.json(users);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// Смена роли пользователя (теперь включает 'admin')
router.put('/users/:id/role', isDirector, async (req, res) => {
    const { id } = req.params;
    const { role } = req.body;
    // Разрешённые роли: client, manager, admin
    if (!['client', 'manager', 'admin'].includes(role)) {
        return res.status(400).json({ error: 'Недопустимая роль' });
    }
    // Нельзя изменить свою роль
    if (parseInt(id) === req.session.user.id) {
        return res.status(403).json({ error: 'Нельзя изменить свою роль' });
    }
    try {
        const target = await query('SELECT role FROM Users WHERE id = ?', [id]);
        if (target.length === 0) {
            return res.status(404).json({ error: 'Пользователь не найден' });
        }
        // Нельзя изменить роль директора или другого администратора
        if (target[0].role === 'director' || target[0].role === 'admin') {
            return res.status(403).json({ error: 'Нельзя изменить роль директора или администратора' });
        }
        await run('UPDATE Users SET role = ? WHERE id = ?', [role, id]);
        res.json({ message: 'Роль обновлена' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// Смена пароля пользователя (только администратор)
router.put('/users/:id/password', isAdmin, async (req, res) => {
    const { id } = req.params;
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 6) {
        return res.status(400).json({ error: 'Новый пароль должен содержать минимум 6 символов' });
    }
    try {
        const users = await query('SELECT id FROM Users WHERE id = ?', [id]);
        if (users.length === 0) {
            return res.status(404).json({ error: 'Пользователь не найден' });
        }
        const hashed = await bcrypt.hash(newPassword, 10);
        await run('UPDATE Users SET passwordHash = ? WHERE id = ?', [hashed, id]);
        res.json({ message: 'Пароль пользователя изменён' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

module.exports = router;