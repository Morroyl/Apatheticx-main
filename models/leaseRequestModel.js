const { query, run } = require('../models/db');

const LeaseRequest = {
    async create(userId, warehouseId, startDate, endDate) {
        const result = await run(
            `INSERT INTO LeaseRequests (userId, warehouseId, startDate, endDate, status)
             VALUES (?, ?, ?, ?, 'pending')`,
            [userId, warehouseId, startDate, endDate]
        );
        return result.id; // lastID
    },

    async findById(id) {
        const requests = await query(
            `SELECT r.*, w.name as warehouseName
             FROM LeaseRequests r
             JOIN Warehouses w ON r.warehouseId = w.id
             WHERE r.id = ?`,
            [id]
        );
        return requests[0];
    },

    async findAll() {
        return await query(
            `SELECT r.*, w.name as warehouseName, u.fullName as clientName, u.phone, u.email
             FROM LeaseRequests r
             JOIN Warehouses w ON r.warehouseId = w.id
             JOIN Users u ON r.userId = u.id
             ORDER BY r.startDate`
        );
    },

    async findByUser(userId) {
        return await query(
            `SELECT r.*, w.name as warehouseName, w.pricePerMonth,
                    u.fullName as managerName
             FROM LeaseRequests r
             JOIN Warehouses w ON r.warehouseId = w.id
             LEFT JOIN Users u ON r.managerId = u.id
             WHERE r.userId = ?
             ORDER BY r.createdAt DESC`,
            [userId]
        );
    },

    async updateStatus(id, status, managerId = null) {
        const params = [];
        let sql = 'UPDATE LeaseRequests SET status = ?';
        params.push(status);
        if (managerId) {
            sql += ', managerId = ?';
            params.push(managerId);
        }
        sql += ' WHERE id = ?';
        params.push(id);
        await run(sql, params);
    },

    async delete(id) {
        await run('DELETE FROM LeaseRequests WHERE id = ?', [id]);
    }
};

module.exports = LeaseRequest;