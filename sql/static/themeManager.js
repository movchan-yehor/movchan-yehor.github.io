// themeManager.js - Theme management
class ThemeManager {
  static initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    const themeToggle = document.getElementById('themeToggle');

    if (savedTheme === 'light') {
      document.documentElement.classList.add('light-theme');
      themeToggle.textContent = '☀️';
    } else {
      document.documentElement.classList.remove('light-theme');
      themeToggle.textContent = '🌙';
    }

    themeToggle.addEventListener('click', () => {
      const isLight = document.documentElement.classList.toggle('light-theme');
      localStorage.setItem('theme', isLight ? 'light' : 'dark');
      themeToggle.textContent = isLight ? '☀️' : '🌙';
    });
  }
}