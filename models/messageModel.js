const { query, run } = require('../models/db');

const Message = {
    async create(leaseRequestId, senderId, message) {
        const result = await run(
            `INSERT INTO Messages (leaseRequestId, senderId, message, sentAt)
             VALUES (?, ?, ?, datetime('now'))`,
            [leaseRequestId, senderId, message]
        );
        return result.id;
    },

    async findByLeaseRequest(leaseRequestId) {
        return await query(
            `SELECT m.*, u.fullName as senderName
             FROM Messages m
             JOIN Users u ON m.senderId = u.id
             WHERE m.leaseRequestId = ?
             ORDER BY m.sentAt`,
            [leaseRequestId]
        );
    },

    async deleteByLeaseRequest(leaseRequestId) {
        await run('DELETE FROM Messages WHERE leaseRequestId = ?', [leaseRequestId]);
    }
};

module.exports = Message;