async function updateUserMenu() {
    try {
        const res = await fetch('/auth/me');
        if (res.ok) {
            const user = await res.json();
            const menu = document.querySelector('.nav-menu');
            if (!menu) return;

            // Показываем ссылку на профиль
            const profileLink = menu.querySelector('#profile-link');
            if (profileLink) profileLink.style.display = 'inline-block';

            // Удаляем старые ссылки входа/регистрации
            const loginLink = menu.querySelector('a[href="/login"]');
            const registerLink = menu.querySelector('a[href="/register"]');
            if (loginLink) loginLink.remove();
            if (registerLink) registerLink.remove();

            const userNameSpan = document.createElement('span');
            userNameSpan.style.color = '#c084fc';
            userNameSpan.style.marginRight = '1rem';
            userNameSpan.textContent = user.fullName;
            menu.appendChild(userNameSpan);

            if (user.role === 'director') {
                const directorLink = document.createElement('a');
                directorLink.href = '/director-panel';
                directorLink.textContent = 'Управление';
                directorLink.style.marginRight = '1rem';
                menu.appendChild(directorLink);
            } else if (user.role === 'manager') {
                const managerLink = document.createElement('a');
                managerLink.href = '/manager-panel';
                managerLink.textContent = 'Панель менеджера';
                managerLink.style.marginRight = '1rem';
                menu.appendChild(managerLink);
            }

            const logoutBtn = document.createElement('a');
            logoutBtn.href = '#';
            logoutBtn.textContent = 'Выйти';
            logoutBtn.id = 'logout-btn';
            logoutBtn.style.cursor = 'pointer';
            logoutBtn.addEventListener('click', async (e) => {
                e.preventDefault();
                await fetch('/auth/logout', { method: 'POST' });
                window.location.href = '/';
            });
            menu.appendChild(logoutBtn);
        } else {
            // Если не авторизован — скрываем ссылку на профиль
            const profileLink = document.querySelector('#profile-link');
            if (profileLink) profileLink.style.display = 'none';
        }
    } catch (err) {
        console.error('Ошибка обновления меню:', err);
    }
}
document.addEventListener('DOMContentLoaded', updateUserMenu);