require('dotenv').config();
const express = require('express');
const session = require('express-session');
const path = require('path');
const http = require('http');
const socketIo = require('socket.io');
const db = require('./models/db');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, maxAge: 1000 * 60 * 60 * 24 }
}));

// API маршруты
app.use('/api/warehouses', require('./routes/warehouses'));
app.use('/api/reviews', require('./routes/reviews'));
app.use('/auth', require('./routes/auth'));
app.use('/lease-requests', require('./routes/leaseRequests'));
app.use('/manager', require('./routes/manager'));
app.use('/director', require('./routes/director'));

// Статические страницы
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'views/index.html')));
app.get('/warehouses', (req, res) => res.sendFile(path.join(__dirname, 'views/warehouses.html')));
app.get('/reviews', (req, res) => res.sendFile(path.join(__dirname, 'views/reviews.html')));
app.get('/about', (req, res) => res.sendFile(path.join(__dirname, 'views/about.html')));
app.get('/gallery', (req, res) => res.sendFile(path.join(__dirname, 'views/gallery.html')));
app.get('/login', (req, res) => res.sendFile(path.join(__dirname, 'views/login.html')));
app.get('/register', (req, res) => res.sendFile(path.join(__dirname, 'views/register.html')));
app.get('/dashboard', (req, res) => {
    if (!req.session.user) return res.redirect('/login');
    res.sendFile(path.join(__dirname, 'views/dashboard.html'));
});
app.get('/manager-panel', (req, res) => {
    if (!req.session.user || req.session.user.role !== 'manager') {
        return res.status(403).send('Доступ запрещён');
    }
    res.sendFile(path.join(__dirname, 'views/manager.html'));
});
app.get('/director-panel', (req, res) => {
    if (!req.session.user || req.session.user.role !== 'director') {
        return res.status(403).send('Доступ запрещён');
    }
    res.sendFile(path.join(__dirname, 'views/director.html'));
});

// WebSocket
io.on('connection', (socket) => {
    console.log('Новое подключение:', socket.id);

    socket.on('join-appointment', (leaseRequestId) => {
        socket.join(`request-${leaseRequestId}`);
        console.log(`Сокет ${socket.id} присоединился к комнате request-${leaseRequestId}`);
        socket.emit('joined-room', { leaseRequestId });
    });

    socket.on('send-message', async (data) => {
        console.log('Получено сообщение:', data);
        try {
            // Проверяем существование активной заявки
            const requestCheck = await db.query(
                `SELECT id FROM LeaseRequests WHERE id = @id AND status NOT IN ('completed', 'cancelled')`,
                { id: data.appointmentId }
            );
            if (requestCheck.length === 0) {
                console.log(`Заявка ${data.appointmentId} не найдена или завершена, сообщение отклонено`);
                return;
            }

            await db.query(
                `INSERT INTO Messages (leaseRequestId, senderId, message, sentAt)
                 VALUES (@leaseRequestId, @senderId, @message, GETDATE())`,
                { leaseRequestId: data.appointmentId, senderId: data.senderId, message: data.message }
            );
            console.log('Сообщение сохранено в БД');

            const sender = await db.query('SELECT fullName FROM Users WHERE id = @id', { id: data.senderId });
            const senderName = sender[0]?.fullName || 'Пользователь';

            const room = io.sockets.adapter.rooms.get(`request-${data.appointmentId}`);
            console.log(`В комнате request-${data.appointmentId}: ${room ? room.size : 0} клиентов`);

            io.to(`request-${data.appointmentId}`).emit('new-message', {
                senderId: data.senderId,
                senderName: senderName,
                message: data.message,
                sentAt: new Date()
            });
            console.log(`Сообщение разослано в комнату request-${data.appointmentId}`);
        } catch (err) {
            console.error('Ошибка сохранения сообщения:', err);
        }
    });

    socket.on('disconnect', () => {
        console.log('Отключился:', socket.id);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Сервер запущен на http://localhost:${PORT}`));