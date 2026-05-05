const express = require('express');
const { query, run } = require('../models/db');
const { isDirector } = require('../middlewares/roleMiddleware');
const router = express.Router();

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

router.get('/users', isDirector, async (req, res) => {
    try {
        const users = await query(
            `SELECT id, fullName, email, phone, role, createdAt FROM Users ORDER BY createdAt DESC`
        );
        res.json(users);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

router.put('/users/:id/role', isDirector, async (req, res) => {
    const { id } = req.params;
    const { role } = req.body;
    if (!['client', 'manager'].includes(role)) {
        return res.status(400).json({ error: 'Недопустимая роль' });
    }
    if (parseInt(id) === req.session.user.id) {
        return res.status(403).json({ error: 'Нельзя изменить свою роль' });
    }
    try {
        await run('UPDATE Users SET role = ? WHERE id = ?', [role, id]);
        res.json({ message: 'Роль обновлена' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

module.exports = router;