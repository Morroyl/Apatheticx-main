(function() {
    const themeToggle = document.getElementById('theme-toggle');
    const body = document.body;
    const icon = themeToggle?.querySelector('img');

    function setTheme(theme) {
        if (theme === 'light') {
            body.classList.add('light-theme');
            if (icon) icon.src = '/icons/sun.svg';
        } else {
            body.classList.remove('light-theme');
            if (icon) icon.src = '/icons/moon.svg';
        }
        localStorage.setItem('theme', theme);
    }

    const savedTheme = localStorage.getItem('theme') || 'dark';
    setTheme(savedTheme);

    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            const newTheme = body.classList.contains('light-theme') ? 'dark' : 'light';
            setTheme(newTheme);
        });
    }
})();