const { query, run } = require('../models/db');

const User = {
    async create(fullName, email, phone, passwordHash, role = 'client') {
        const result = await run(
            `INSERT INTO Users (fullName, email, phone, passwordHash, role)
             VALUES (?, ?, ?, ?, ?)`,
            [fullName, email, phone, passwordHash, role]
        );
        return result.id;
    },

    async findByEmail(email) {
        const users = await query('SELECT * FROM Users WHERE email = ?', [email]);
        return users[0];
    },

    async findById(id) {
        const users = await query('SELECT * FROM Users WHERE id = ?', [id]);
        return users[0];
    },

    async update(id, fields) {
        const allowedFields = ['fullName', 'phone', 'passwordHash'];
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
        const sql = `UPDATE Users SET ${updates.join(', ')} WHERE id = ?`;
        await run(sql, params);
    },

    async delete(id) {
        await run('DELETE FROM Users WHERE id = ?', [id]);
    }
};

module.exports = User;