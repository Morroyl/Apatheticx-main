const express = require('express');
const { query } = require('../models/db');
const { isDirector } = require('../middlewares/roleMiddleware');
const router = express.Router();

// ===== Управление складами =====
router.get('/warehouses', isDirector, async (req, res) => {
    try {
        const warehouses = await db.query('SELECT * FROM Warehouses ORDER BY category, name');
        res.json(warehouses);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

router.post('/warehouses', isDirector, async (req, res) => {
    const { name, description, address, area, pricePerMonth, category } = req.body;
    if (!name || !address || !area || !pricePerMonth) {
        return res.status(400).json({ error: 'Название, адрес, площадь и цена обязательны' });
    }
    try {
        const result = await db.query(
            `INSERT INTO Warehouses (name, description, address, area, pricePerMonth, category)
             OUTPUT INSERTED.id
             VALUES (@name, @description, @address, @area, @pricePerMonth, @category)`,
            { name, description, address, area, pricePerMonth, category }
        );
        res.status(201).json({ id: result[0]?.id, message: 'Склад добавлен' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

router.put('/warehouses/:id', isDirector, async (req, res) => {
    const { id } = req.params;
    const { name, description, address, area, pricePerMonth, category } = req.body;
    try {
        await db.query(
            `UPDATE Warehouses SET name = @name, description = @description, address = @address,
                area = @area, pricePerMonth = @pricePerMonth, category = @category WHERE id = @id`,
            { name, description, address, area, pricePerMonth, category, id }
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
        await db.query('DELETE FROM Warehouses WHERE id = @id', { id });
        res.json({ message: 'Склад удалён' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// ===== Управление пользователями =====
router.get('/users', isDirector, async (req, res) => {
    try {
        const users = await db.query(
            `SELECT id, fullName, email, phone, role, createdAt
             FROM Users ORDER BY createdAt DESC`
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
        await db.query('UPDATE Users SET role = @role WHERE id = @id', { role, id });
        res.json({ message: 'Роль обновлена' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

module.exports = router;