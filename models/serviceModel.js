const { query, run } = require('../models/db');

const Warehouse = {
    async findAll() {
        return await db.query('SELECT * FROM Warehouses ORDER BY category, name');
    },

    async findById(id) {
        const warehouses = await db.query('SELECT * FROM Warehouses WHERE id = @id', { id });
        return warehouses[0];
    },

    async create(name, description, address, area, pricePerMonth, category) {
        const result = await db.query(
            `INSERT INTO Warehouses (name, description, address, area, pricePerMonth, category)
             OUTPUT INSERTED.id
             VALUES (@name, @description, @address, @area, @pricePerMonth, @category)`,
            { name, description, address, area, pricePerMonth, category }
        );
        return result[0]?.id;
    },

    async update(id, fields) {
        const allowedFields = ['name', 'description', 'address', 'area', 'pricePerMonth', 'category'];
        const updates = [];
        const params = { id };
        for (const field of allowedFields) {
            if (fields[field] !== undefined) {
                updates.push(`${field} = @${field}`);
                params[field] = fields[field];
            }
        }
        if (updates.length === 0) return;
        const query = `UPDATE Warehouses SET ${updates.join(', ')} WHERE id = @id`;
        await db.query(query, params);
    },

    async delete(id) {
        await db.query('DELETE FROM Warehouses WHERE id = @id', { id });
    }
};

module.exports = Warehouse;