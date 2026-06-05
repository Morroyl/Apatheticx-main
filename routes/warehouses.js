// routes/warehouses.js
const express = require('express');
const { query } = require('../models/db');
const router = express.Router();

router.get('/', async (req, res) => {
    try {
        const warehouses = await query('SELECT * FROM Warehouses ORDER BY category, name');
        res.json(warehouses);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// Новый маршрут для одного склада
router.get('/:id', async (req, res) => {
    try {
        const warehouses = await query('SELECT * FROM Warehouses WHERE id = ?', [req.params.id]);
        if (warehouses.length === 0) {
            return res.status(404).json({ error: 'Склад не найден' });
        }
        res.json(warehouses[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

module.exports = router;