// public/js/client.js
let currentUserId = null;
let currentRequestId = null;
const socket = io();

socket.on('joined-room', (data) => {
    console.log('✅ Подтверждено присоединение к комнате заявки', data.leaseRequestId);
});

async function loadUser() {
    try {
        const res = await fetch('/auth/me');
        if (!res.ok) throw new Error('Не авторизован');
        const user = await res.json();
        currentUserId = user.id;
        document.getElementById('user-name').textContent = user.fullName;
        return user;
    } catch (err) {
        window.location.href = '/login';
    }
}

async function loadWarehouses() {
    const res = await fetch('/lease-requests/warehouses');
    const warehouses = await res.json();
    const select = document.getElementById('warehouse');
    warehouses.forEach(w => {
        const option = document.createElement('option');
        option.value = w.id;
        option.textContent = `${w.name} (${w.address}) – ${w.pricePerMonth} ₽/м²`;
        select.appendChild(option);
    });
}

async function loadRequests() {
    const container = document.getElementById('requests-list');
    container.innerHTML = '<p>Загрузка...</p>';
    try {
        const res = await fetch('/lease-requests/my');
        const requests = await res.json();
        if (requests.length === 0) {
            container.innerHTML = '<p>У вас пока нет заявок.</p>';
            return;
        }
        let html = '<table><thead><tr><th>Склад</th><th>Даты</th><th>Статус</th><th>Менеджер</th><th>Чат</th></tr></thead><tbody>';
        requests.forEach(r => {
            const statusMap = {
                'pending': 'На рассмотрении',
                'confirmed': 'Подтверждена',
                'cancelled': 'Отменена',
                'completed': 'Завершена'
            };
            const dates = `${new Date(r.startDate).toLocaleDateString()} – ${new Date(r.endDate).toLocaleDateString()}`;
            html += `<tr>
                <td>${r.warehouseName}</td>
                <td>${dates}</td>
                <td>${statusMap[r.status] || r.status}</td>
                <td>${r.managerName || 'Не назначен'}</td>
                <td><button class="btn chat-btn" data-request-id="${r.id}" ${r.status === 'cancelled' || r.status === 'completed' ? 'disabled' : ''}>Чат</button></td>
            </tr>`;
        });
        html += '</tbody></table>';
        container.innerHTML = html;

        document.querySelectorAll('.chat-btn').forEach(btn => {
            btn.addEventListener('click', () => openChat(btn.dataset.requestId));
        });
    } catch (err) {
        container.innerHTML = '<p>Ошибка загрузки заявок.</p>';
    }
}

function openChat(requestId) {
    currentRequestId = requestId;
    document.getElementById('chat-container').style.display = 'block';
    document.getElementById('chat-request-id').textContent = requestId;
    document.getElementById('chat-messages').innerHTML = '';
    socket.emit('join-appointment', requestId);
    loadMessages(requestId);
}

async function loadMessages(requestId) {
    try {
        const res = await fetch(`/lease-requests/${requestId}/messages`);
        if (!res.ok) throw new Error('Ошибка загрузки сообщений');
        const messages = await res.json();
        messages.forEach(msg => displayMessage(msg));
        scrollChatToBottom();
    } catch (err) {
        console.error('Ошибка загрузки сообщений:', err);
    }
}

function displayMessage(msg) {
    const chatDiv = document.getElementById('chat-messages');
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message');
    if (msg.senderId === currentUserId) {
        messageDiv.classList.add('own');
    } else {
        messageDiv.classList.add('other');
    }
    const time = new Date(msg.sentAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    messageDiv.innerHTML = `<strong>${msg.senderName || 'Вы'}</strong><br>${msg.message}<br><small>${time}</small>`;
    chatDiv.appendChild(messageDiv);
}

function scrollChatToBottom() {
    const chatDiv = document.getElementById('chat-messages');
    chatDiv.scrollTop = chatDiv.scrollHeight;
}

document.getElementById('send-message-btn').addEventListener('click', () => {
    const input = document.getElementById('chat-input');
    const message = input.value.trim();
    if (!message || !currentRequestId) return;
    socket.emit('send-message', {
        appointmentId: currentRequestId,
        senderId: currentUserId,
        message: message
    });
    input.value = '';
});

socket.on('new-message', (data) => {
    displayMessage(data);
    scrollChatToBottom();
});

document.getElementById('lease-request-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const warehouseId = document.getElementById('warehouse').value;
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;
    const comment = document.getElementById('comment').value;

    const res = await fetch('/lease-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ warehouseId, startDate, endDate, comment })
    });
    if (res.ok) {
        alert('Заявка отправлена!');
        document.getElementById('lease-request-form').reset();
        loadRequests();
    } else {
        const data = await res.json();
        alert(data.error || 'Ошибка при отправке заявки');
    }
});

(async () => {
    await loadUser();
    await loadWarehouses();
    await loadRequests();
})();