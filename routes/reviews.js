const express = require('express');
const { query, run } = require('../models/db');
const { isAuthenticated } = require('../middlewares/authMiddleware');
const { isDirector } = require('../middlewares/roleMiddleware');
const router = express.Router();

router.get('/', async (req, res) => {
    try {
        const reviews = await query(`
            SELECT r.*, u.fullName, w.name as warehouseName 
            FROM Reviews r
            JOIN Users u ON r.userId = u.id
            LEFT JOIN Warehouses w ON r.warehouseId = w.id
            ORDER BY r.createdAt DESC
        `);
        res.json(reviews);
    } catch (err) {
        console.error('Ошибка получения отзывов:', err);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

router.post('/', isAuthenticated, async (req, res) => {
    const { rating, comment, warehouseId } = req.body;
    const userId = req.session.user.id;

    try {
        const existing = await query(
            'SELECT id FROM Reviews WHERE userId = ? AND (warehouseId IS NULL OR warehouseId = ?)',
            [userId, warehouseId || null]
        );
        if (existing.length > 0) {
            return res.status(403).json({ error: 'Вы уже оставили отзыв для этого объекта' });
        }

        await run(
            'INSERT INTO Reviews (userId, warehouseId, rating, comment) VALUES (?, ?, ?, ?)',
            [userId, warehouseId || null, rating, comment]
        );
        res.status(201).json({ message: 'Отзыв добавлен' });
    } catch (err) {
        console.error('Ошибка добавления отзыва:', err);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

router.delete('/:id', isDirector, async (req, res) => {
    const { id } = req.params;
    try {
        await run('DELETE FROM Reviews WHERE id = ?', [id]);
        res.json({ message: 'Отзыв удалён' });
    } catch (err) {
        console.error('Ошибка удаления отзыва:', err);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

module.exports = router;