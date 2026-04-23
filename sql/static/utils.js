// utils.js - Utility functions
class Utils {
  static escapeHtml(text) {
    if (text == null) return '';
    const div = document.createElement('div');
    div.textContent = String(text);
    return div.innerHTML;
  }

  static formatText(text) {
    if (text == null) return '';
    return String(text).replace(/\n/g, '<br>');
  }

  static scrollToSection(id) {
    const section = document.getElementById(id);
    if (section) section.scrollIntoView({ behavior: 'smooth' });
  }

  static showError(message) {
    const container = document.getElementById('content');
    container.innerHTML = `<div class="error">${message}</div>`;
  }
}