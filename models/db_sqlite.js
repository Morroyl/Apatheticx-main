
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '..', 'database.sqlite');
const db = new sqlite3.Database(dbPath);

function query(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
}

function run(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.run(sql, params, function(err) {
            if (err) reject(err);
            else resolve({ id: this.lastID, changes: this.changes });
        });
    });
}

// Инициализация таблиц
function initDatabase() {
    db.run(`CREATE TABLE IF NOT EXISTS Users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        fullName TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        phone TEXT,
        passwordHash TEXT NOT NULL,
        role TEXT DEFAULT 'client',
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS ArchivedMessages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    originalId INTEGER NOT NULL,
    leaseRequestId INTEGER NOT NULL,
    senderId INTEGER NOT NULL,
    message TEXT NOT NULL,
    sentAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS Warehouses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        address TEXT NOT NULL,
        area REAL NOT NULL,
        pricePerMonth REAL NOT NULL,
        category TEXT,
        imageUrl TEXT
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS LeaseRequests (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId INTEGER NOT NULL,
        warehouseId INTEGER NOT NULL,
        startDate DATETIME NOT NULL,
        endDate DATETIME NOT NULL,
        status TEXT DEFAULT 'pending',
        managerId INTEGER,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (userId) REFERENCES Users(id),
        FOREIGN KEY (warehouseId) REFERENCES Warehouses(id),
        FOREIGN KEY (managerId) REFERENCES Users(id)
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS Messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        leaseRequestId INTEGER NOT NULL,
        senderId INTEGER NOT NULL,
        message TEXT NOT NULL,
        sentAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (leaseRequestId) REFERENCES LeaseRequests(id),
        FOREIGN KEY (senderId) REFERENCES Users(id)
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS Reviews (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId INTEGER NOT NULL,
        warehouseId INTEGER,
        rating INTEGER CHECK(rating >= 1 AND rating <= 5),
        comment TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (userId) REFERENCES Users(id),
        FOREIGN KEY (warehouseId) REFERENCES Warehouses(id)
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS ArchivedLeaseRequests (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        originalId INTEGER NOT NULL,
        userId INTEGER NOT NULL,
        warehouseId INTEGER NOT NULL,
        startDate DATETIME NOT NULL,
        endDate DATETIME NOT NULL,
        status TEXT DEFAULT 'completed',
        managerId INTEGER,
        createdAt DATETIME,
        archivedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);


    // Добавляем тестовые склады
    db.get(`SELECT COUNT(*) as count FROM Warehouses`, (err, row) => {
        if (err) return;
        if (row.count === 0) {
            const warehouses = [
                ['Склад на Ленинградском шоссе', 'Отапливаемый склад, удобный подъезд для фур', 'г. Москва, Ленинградское шоссе, д. 10', 500, 800, 'сухой', '/images/warehouse1.jpg'],
                ['Холодильный склад', 'Температурный режим от -5 до +5, стеллажи', 'г. Москва, ул. Промышленная, д. 3', 200, 1200, 'холодильник', '/images/warehouse2.jpg'],
                ['Овощехранилище', 'Вентиляция, поддержание влажности', 'г. Москва, МКАД, 12-й км', 1000, 600, 'овощной', '/images/warehouse3.jpg']
            ];
            const stmt = db.prepare(`INSERT INTO Warehouses (name, description, address, area, pricePerMonth, category, imageUrl) VALUES (?, ?, ?, ?, ?, ?, ?)`);
            warehouses.forEach(w => stmt.run(w));
            stmt.finalize();
            console.log('Добавлены тестовые склады');
        }
    });
}

initDatabase();

module.exports = { query, run, db };