const { query, run } = require('../models/db');

const Warehouse = {
    async findAll() {
        return await query('SELECT * FROM Warehouses ORDER BY category, name');
    },

    async findById(id) {
        const warehouses = await query('SELECT * FROM Warehouses WHERE id = ?', [id]);
        return warehouses[0];
    },

    async create(name, description, address, area, pricePerMonth, category) {
        const result = await run(
            `INSERT INTO Warehouses (name, description, address, area, pricePerMonth, category)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [name, description, address, area, pricePerMonth, category]
        );
        return result.id;
    },

    async update(id, fields) {
        const allowedFields = ['name', 'description', 'address', 'area', 'pricePerMonth', 'category'];
        const updates = [];
        const params = [];
        for (const field of allowedFields) {
            if (fields[field] !== undefined) {
                updates.push(`${field} = ?`);
                params.push(fields[field]);
            }
        }
        if (updates.length === 0) return;
        params.push(id);
        const sql = `UPDATE Warehouses SET ${updates.join(', ')} WHERE id = ?`;
        await run(sql, params);
    },

    async delete(id) {
        await run('DELETE FROM Warehouses WHERE id = ?', [id]);
    }
};

module.exports = Warehouse;