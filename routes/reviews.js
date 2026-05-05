const express = require('express');
const { query } = require('../models/db');
const { isAuthenticated } = require('../middlewares/authMiddleware');
const { isDirector } = require('../middlewares/roleMiddleware');
const router = express.Router();

// Получить все отзывы
router.get('/', async (req, res) => {
    try {
        const reviews = await db.query(
            `SELECT r.*, u.fullName, w.name as warehouseName FROM Reviews r
             JOIN Users u ON r.userId = u.id
             LEFT JOIN Warehouses w ON r.warehouseId = w.id
             ORDER BY r.createdAt DESC`
        );
        res.json(reviews);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// Добавить отзыв (только для клиентов)
router.post('/', isAuthenticated, async (req, res) => {
    const { rating, comment, warehouseId } = req.body;
    const userId = req.session.user.id;

    try {
        const existing = await db.query(
            'SELECT id FROM Reviews WHERE userId = @userId AND (warehouseId IS NULL OR warehouseId = @warehouseId)',
            { userId, warehouseId: warehouseId || null }
        );
        if (existing.length > 0) {
            return res.status(403).json({ error: 'Вы уже оставили отзыв для этого объекта' });
        }

        await db.query(
            'INSERT INTO Reviews (userId, warehouseId, rating, comment) VALUES (@userId, @warehouseId, @rating, @comment)',
            { userId, warehouseId: warehouseId || null, rating, comment }
        );
        res.status(201).json({ message: 'Отзыв добавлен' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// Удалить отзыв (только для директора)
router.delete('/:id', isDirector, async (req, res) => {
    const { id } = req.params;
    try {
        await db.query('DELETE FROM Reviews WHERE id = @id', { id });
        res.json({ message: 'Отзыв удалён' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

module.exports = router;