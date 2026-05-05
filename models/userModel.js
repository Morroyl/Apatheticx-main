const { query, run } = require('../models/db');

const User = {
    async create(fullName, email, phone, passwordHash, role = 'client') {
        const result = await db.query(
            `INSERT INTO Users (fullName, email, phone, passwordHash, role)
             OUTPUT INSERTED.id
             VALUES (@fullName, @email, @phone, @passwordHash, @role)`,
            { fullName, email, phone, passwordHash, role }
        );
        return result[0]?.id;
    },

    async findByEmail(email) {
        const users = await db.query('SELECT * FROM Users WHERE email = @email', { email });
        return users[0];
    },

    async findById(id) {
        const users = await db.query('SELECT * FROM Users WHERE id = @id', { id });
        return users[0];
    },

    async update(id, fields) {
        const allowedFields = ['fullName', 'phone', 'passwordHash'];
        const updates = [];
        const params = { id };
        for (const field of allowedFields) {
            if (fields[field] !== undefined) {
                updates.push(`${field} = @${field}`);
                params[field] = fields[field];
            }
        }
        if (updates.length === 0) return;
        const query = `UPDATE Users SET ${updates.join(', ')} WHERE id = @id`;
        await db.query(query, params);
    },

    async delete(id) {
        await db.query('DELETE FROM Users WHERE id = @id', { id });
    }
};

module.exports = User;