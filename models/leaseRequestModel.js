const { query, run } = require('../models/db');

const LeaseRequest = {
    async create(userId, warehouseId, startDate, endDate) {
        const result = await db.query(
            `INSERT INTO LeaseRequests (userId, warehouseId, startDate, endDate, status)
             OUTPUT INSERTED.id
             VALUES (@userId, @warehouseId, @startDate, @endDate, 'pending')`,
            { userId, warehouseId, startDate, endDate }
        );
        return result[0]?.id;
    },

    async findById(id) {
        const requests = await db.query(
            `SELECT r.*, w.name as warehouseName
             FROM LeaseRequests r
             JOIN Warehouses w ON r.warehouseId = w.id
             WHERE r.id = @id`,
            { id }
        );
        return requests[0];
    },

    async findAll() {
        return await db.query(
            `SELECT r.*, w.name as warehouseName, u.fullName as clientName, u.phone, u.email
             FROM LeaseRequests r
             JOIN Warehouses w ON r.warehouseId = w.id
             JOIN Users u ON r.userId = u.id
             ORDER BY r.startDate`
        );
    },

    async findByUser(userId) {
        return await db.query(
            `SELECT r.*, w.name as warehouseName, w.pricePerMonth,
                    u.fullName as managerName
             FROM LeaseRequests r
             JOIN Warehouses w ON r.warehouseId = w.id
             LEFT JOIN Users u ON r.managerId = u.id
             WHERE r.userId = @userId
             ORDER BY r.createdAt DESC`,
            { userId }
        );
    },

    async updateStatus(id, status, managerId = null) {
        const params = { id, status };
        let query = 'UPDATE LeaseRequests SET status = @status';
        if (managerId) {
            query += ', managerId = @managerId';
            params.managerId = managerId;
        }
        query += ' WHERE id = @id';
        await db.query(query, params);
    },

    async delete(id) {
        await db.query('DELETE FROM LeaseRequests WHERE id = @id', { id });
    }
};

module.exports = LeaseRequest;