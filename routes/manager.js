const express = require('express');
const { query, run } = require('../models/db');
const { isManagerOrDirector } = require('../middlewares/roleMiddleware');
const router = express.Router();

router.get('/leaserequests', isManagerOrDirector, async (req, res) => {
    try {
        const requests = await query(
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
        console.error('Ошибка получения заявок:', err);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

router.put('/leaserequests/:id', isManagerOrDirector, async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    const managerId = req.session.user.id;

    try {
        const lease = await query('SELECT * FROM LeaseRequests WHERE id = ?', [id]);
        if (lease.length === 0) {
            return res.status(404).json({ error: 'Заявка не найдена' });
        }

        if (status === 'completed') {
            await run(
                `INSERT INTO ArchivedLeaseRequests (originalId, userId, warehouseId, startDate, endDate, status, managerId, createdAt)
                 VALUES (?, ?, ?, ?, ?, 'completed', ?, ?)`,
                [id, lease[0].userId, lease[0].warehouseId, lease[0].startDate, lease[0].endDate, managerId, lease[0].createdAt]
            );

            const messages = await query('SELECT * FROM Messages WHERE leaseRequestId = ?', [id]);
            for (const msg of messages) {
                await run(
                    `INSERT INTO ArchivedMessages (originalId, leaseRequestId, senderId, message, sentAt)
                     VALUES (?, ?, ?, ?, ?)`,
                    [msg.id, id, msg.senderId, msg.message, msg.sentAt]
                );
            }

            await run('DELETE FROM Messages WHERE leaseRequestId = ?', [id]);
            await run('DELETE FROM LeaseRequests WHERE id = ?', [id]);

            res.json({ message: 'Заявка завершена и перемещена в архив' });
        } else {
            await run(
                `UPDATE LeaseRequests SET status = ?, managerId = ? WHERE id = ?`,
                [status, managerId, id]
            );
            res.json({ message: 'Статус обновлён' });
        }
    } catch (err) {
        console.error('Ошибка при обновлении статуса:', err);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

router.get('/leaserequests/:id/messages', isManagerOrDirector, async (req, res) => {
    const { id } = req.params;
    try {
        const messages = await query(
            `SELECT m.*, u.fullName as senderName
             FROM Messages m
             JOIN Users u ON m.senderId = u.id
             WHERE m.leaseRequestId = ?
             ORDER BY m.sentAt`,
            [id]
        );
        res.json(messages);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

router.get('/archive', isManagerOrDirector, async (req, res) => {
    try {
        const archived = await query(
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
        console.error('Ошибка получения архива:', err);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

module.exports = router;