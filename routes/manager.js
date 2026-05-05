const express = require('express');
const { query } = require('../models/db');
const { isManagerOrDirector } = require('../middlewares/roleMiddleware');
const { sql } = require('../models/db');

const router = express.Router();

// Получить все активные заявки (с именем менеджера)
router.get('/leaserequests', isManagerOrDirector, async (req, res) => {
    try {
        const requests = await db.query(
            `SELECT r.*, w.name as warehouseName, 
                    u.fullName as clientName, u.phone, u.email,
                    m.fullName as managerName
             FROM LeaseRequests r
             JOIN Warehouses w ON r.warehouseId = w.id
             JOIN Users u ON r.userId = u.id
             LEFT JOIN Users m ON r.managerId = m.id
             WHERE r.status != 'completed'
             ORDER BY r.startDate`
        );
        res.json(requests);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// Получить одну заявку по ID
router.get('/leaserequests/:id', isManagerOrDirector, async (req, res) => {
    const { id } = req.params;
    try {
        const request = await db.query(
            `SELECT r.*, w.name as warehouseName, 
                    u.fullName as clientName, u.phone, u.email,
                    m.fullName as managerName
             FROM LeaseRequests r
             JOIN Warehouses w ON r.warehouseId = w.id
             JOIN Users u ON r.userId = u.id
             LEFT JOIN Users m ON r.managerId = m.id
             WHERE r.id = @id`,
            { id }
        );
        if (request.length === 0) {
            return res.status(404).json({ error: 'Заявка не найдена' });
        }
        res.json(request[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// Обновить статус заявки (с переносом в архив при завершении)
router.put('/leaserequests/:id', isManagerOrDirector, async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    const managerId = req.session.user.id;

    const pool = await db.poolConnect;
    const transaction = new sql.Transaction(pool);

    try {
        await transaction.begin();

        const request = await db.query('SELECT * FROM LeaseRequests WHERE id = @id', { id });
        if (!request.length) {
            await transaction.rollback();
            return res.status(404).json({ error: 'Заявка не найдена' });
        }
        const reqData = request[0];

        if (status === 'completed') {
            const archiveResult = await db.query(
                `INSERT INTO ArchivedLeaseRequests (originalId, userId, warehouseId, startDate, endDate, status, managerId, createdAt, archivedAt)
                 OUTPUT INSERTED.id
                 VALUES (@originalId, @userId, @warehouseId, @startDate, @endDate, 'completed', @managerId, @createdAt, GETDATE())`,
                {
                    originalId: reqData.id,
                    userId: reqData.userId,
                    warehouseId: reqData.warehouseId,
                    startDate: reqData.startDate,
                    endDate: reqData.endDate,
                    managerId: managerId,
                    createdAt: reqData.createdAt
                }
            );
            const archivedId = archiveResult[0].id;

            const messages = await db.query('SELECT * FROM Messages WHERE leaseRequestId = @leaseRequestId', { leaseRequestId: id });
            for (let msg of messages) {
                await db.query(
                    `INSERT INTO ArchivedMessages (originalId, leaseRequestId, senderId, message, sentAt)
                     VALUES (@originalId, @archivedId, @senderId, @message, @sentAt)`,
                    {
                        originalId: msg.id,
                        archivedId: archivedId,
                        senderId: msg.senderId,
                        message: msg.message,
                        sentAt: msg.sentAt
                    }
                );
            }

            await db.query('DELETE FROM Messages WHERE leaseRequestId = @leaseRequestId', { leaseRequestId: id });
            await db.query('DELETE FROM LeaseRequests WHERE id = @id', { id });

            await transaction.commit();
            res.json({ message: 'Заявка завершена и перемещена в архив' });
        } else {
            await db.query(
                `UPDATE LeaseRequests SET status = @status, managerId = @managerId WHERE id = @id`,
                { status, managerId, id }
            );
            await transaction.commit();
            res.json({ message: 'Статус обновлён' });
        }
    } catch (err) {
        await transaction.rollback();
        console.error('Ошибка при обновлении статуса:', err);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// Получить сообщения для заявки
router.get('/leaserequests/:id/messages', isManagerOrDirector, async (req, res) => {
    const { id } = req.params;
    try {
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

// Получить архивные заявки
router.get('/archive', isManagerOrDirector, async (req, res) => {
    try {
        const archived = await db.query(
            `SELECT a.*, w.name as warehouseName, u.fullName as clientName, u.phone, u.email,
                    m.fullName as managerName
             FROM ArchivedLeaseRequests a
             JOIN Warehouses w ON a.warehouseId = w.id
             JOIN Users u ON a.userId = u.id
             LEFT JOIN Users m ON a.managerId = m.id
             ORDER BY a.archivedAt DESC`
        );
        res.json(archived);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

module.exports = router;