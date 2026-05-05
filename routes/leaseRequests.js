const express = require('express');
const { query } = require('../models/db');
const { isAuthenticated } = require('../middlewares/authMiddleware');
const router = express.Router();

// Универсальная функция для преобразования даты из формы в формат SQL Server (YYYY-MM-DD HH:mm:ss)
function formatDateForSQL(dateString) {
    if (!dateString) return null;
    // Пытаемся создать объект Date из строки
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
        console.error('Неверный формат даты:', dateString);
        return null;
    }
    // Форматируем в YYYY-MM-DD HH:mm:ss (время 00:00:00 для date, или точное для datetime-local)
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = '00';
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

// Получить список складов для выпадающего списка
router.get('/warehouses', async (req, res) => {
    try {
        const warehouses = await db.query('SELECT id, name, pricePerMonth, address FROM Warehouses ORDER BY name');
        res.json(warehouses);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// Создать заявку на аренду
router.post('/', isAuthenticated, async (req, res) => {
    const { warehouseId, startDate, endDate, comment } = req.body;
    const userId = req.session.user.id;

    if (!warehouseId || !startDate || !endDate) {
        return res.status(400).json({ error: 'Выберите склад, даты начала и окончания' });
    }

    const formattedStart = formatDateForSQL(startDate);
    const formattedEnd = formatDateForSQL(endDate);
    if (!formattedStart || !formattedEnd) {
        return res.status(400).json({ error: 'Неверный формат даты' });
    }

    try {
        await db.query(
            `INSERT INTO LeaseRequests (userId, warehouseId, startDate, endDate, status)
             VALUES (@userId, @warehouseId, @startDate, @endDate, 'pending')`,
            { userId, warehouseId, startDate: formattedStart, endDate: formattedEnd }
        );
        res.status(201).json({ message: 'Заявка создана' });
    } catch (err) {
        console.error('Ошибка при создании заявки:', err);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// Получить историю заявок текущего клиента
router.get('/my', isAuthenticated, async (req, res) => {
    const userId = req.session.user.id;
    try {
        const requests = await db.query(
            `SELECT r.*, w.name as warehouseName, w.pricePerMonth,
                    u.fullName as managerName
             FROM LeaseRequests r
             JOIN Warehouses w ON r.warehouseId = w.id
             LEFT JOIN Users u ON r.managerId = u.id
             WHERE r.userId = @userId
             ORDER BY r.createdAt DESC`,
            { userId }
        );
        res.json(requests);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// Получить сообщения по заявке (для клиента)
router.get('/:id/messages', isAuthenticated, async (req, res) => {
    const { id } = req.params;
    const userId = req.session.user.id;
    try {
        const request = await db.query(
            'SELECT id FROM LeaseRequests WHERE id = @id AND userId = @userId',
            { id, userId }
        );
        if (request.length === 0) {
            return res.status(404).json({ error: 'Заявка не найдена' });
        }
        const messages = await db.query(
            `SELECT m.*, u.fullName as senderName
             FROM Messages m
             JOIN Users u ON m.senderId = u.id
             WHERE m.leaseRequestId = @id
             ORDER BY m.sentAt`,
            { id }
        );
        res.json(messages);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

module.exports = router;