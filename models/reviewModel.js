const { query, run } = require('../models/db');

const Review = {
    async create(userId, warehouseId, rating, comment) {
        const result = await db.query(
            `INSERT INTO Reviews (userId, warehouseId, rating, comment, createdAt)
             OUTPUT INSERTED.id
             VALUES (@userId, @warehouseId, @rating, @comment, GETDATE())`,
            { userId, warehouseId, rating, comment }
        );
        return result[0]?.id;
    },

    async findAll() {
        return await db.query(
            `SELECT r.*, u.fullName, w.name as warehouseName
             FROM Reviews r
             JOIN Users u ON r.userId = u.id
             LEFT JOIN Warehouses w ON r.warehouseId = w.id
             ORDER BY r.createdAt DESC`
        );
    },

    async findByUser(userId) {
        return await db.query(
            `SELECT * FROM Reviews WHERE userId = @userId ORDER BY createdAt DESC`,
            { userId }
        );
    },

    async delete(id) {
        await db.query('DELETE FROM Reviews WHERE id = @id', { id });
    }
};

module.exports = Review;