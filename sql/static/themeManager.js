// themeManager.js - Theme management
class ThemeManager {
  static initTheme() {
    const themeToggle = document.getElementById('themeToggle');
    if (!themeToggle) {
      console.warn('ThemeManager: #themeToggle not found in DOM');
      return;
    }

    const saved = localStorage.getItem('theme');
    // Default to 'light' only if a valid value is stored, otherwise fall back to 'light'
    const isLight = saved !== 'dark';

    ThemeManager.applyTheme(isLight, themeToggle);

    themeToggle.addEventListener('click', () => {
      const nowLight = document.documentElement.classList.toggle('light-theme');
      localStorage.setItem('theme', nowLight ? 'light' : 'dark');
      themeToggle.textContent = nowLight ? '☀️' : '🌙';
    });
  }

  static applyTheme(isLight, toggleEl) {
    document.documentElement.classList.toggle('light-theme', isLight);
    toggleEl.textContent = isLight ? '☀️' : '🌙';
  }
}