    // Логіка перемикання теми
    const themeToggle = document.getElementById('themeToggle');
    const body = document.body;

    // Перевірка збереженої теми при завантаженні
    const currentTheme = localStorage.getItem('theme');
    if (currentTheme) {
        body.classList.add(currentTheme);
        if (currentTheme === 'dark-theme') {
            themeToggle.textContent = 'Світла тема';
        }
    }

    themeToggle.addEventListener('click', () => {
        body.classList.toggle('dark-theme');
        
        let theme = 'light-theme';
        if (body.classList.contains('dark-theme')) {
            theme = 'dark-theme';
            themeToggle.textContent = 'Світла тема';
        } else {
            themeToggle.textContent = 'Темна тема';
        }
        
        // Збереження вибору
        localStorage.setItem('theme', theme);
    });