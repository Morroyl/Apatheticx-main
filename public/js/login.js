// public/js/login.js
document.querySelectorAll('.toggle-password').forEach(icon => {
    icon.addEventListener('click', function() {
        const targetId = this.dataset.target;
        const input = document.getElementById(targetId);
        const type = input.getAttribute('type') === 'password' ? 'text' : 'password';
        input.setAttribute('type', type);
        this.src = type === 'password' ? '/icons/eye.svg' : '/icons/eye-slash.svg';
    });
});

document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const res = await fetch('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (res.ok) {
        if (data.role === 'manager') {
            window.location.href = '/manager-panel';
        } else if (data.role === 'director') {
            window.location.href = '/director-panel';
        } else {
            window.location.href = '/dashboard';
        }
    } else {
        document.getElementById('error').textContent = data.error;
    }
});