const { query, run } = require('../models/db');

const Review = {
    async create(userId, warehouseId, rating, comment) {
        const result = await run(
            `INSERT INTO Reviews (userId, warehouseId, rating, comment, createdAt)
             VALUES (?, ?, ?, ?, datetime('now'))`,
            [userId, warehouseId, rating, comment]
        );
        return result.id;
    },

    async findAll() {
        return await query(
            `SELECT r.*, u.fullName, w.name as warehouseName
             FROM Reviews r
             JOIN Users u ON r.userId = u.id
             LEFT JOIN Warehouses w ON r.warehouseId = w.id
             ORDER BY r.createdAt DESC`
        );
    },

    async findByUser(userId) {
        return await query(
            `SELECT * FROM Reviews WHERE userId = ? ORDER BY createdAt DESC`,
            [userId]
        );
    },

    async delete(id) {
        await run('DELETE FROM Reviews WHERE id = ?', [id]);
    }
};

module.exports = Review;