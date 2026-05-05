const { query, run } = require('../models/db');

const Message = {
    async create(leaseRequestId, senderId, message) {
        const result = await db.query(
            `INSERT INTO Messages (leaseRequestId, senderId, message, sentAt)
             OUTPUT INSERTED.id
             VALUES (@leaseRequestId, @senderId, @message, GETDATE())`,
            { leaseRequestId, senderId, message }
        );
        return result[0]?.id;
    },

    async findByLeaseRequest(leaseRequestId) {
        return await db.query(
            `SELECT m.*, u.fullName as senderName
             FROM Messages m
             JOIN Users u ON m.senderId = u.id
             WHERE m.leaseRequestId = @leaseRequestId
             ORDER BY m.sentAt`,
            { leaseRequestId }
        );
    },

    async deleteByLeaseRequest(leaseRequestId) {
        await db.query('DELETE FROM Messages WHERE leaseRequestId = @leaseRequestId', { leaseRequestId });
    }
};

module.exports = Message;