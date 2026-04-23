// utils.js - Utility functions
class Utils {
  static escapeHtml(text) {
    if (text == null) return '';
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  static formatText(text) {
    if (text == null) return '';
    // Replace newlines with <br> — extend here if markdown-like formatting is needed
    return String(text).replace(/\n/g, '<br>');
  }

  static scrollToSection(id) {
    const section = document.getElementById(id);
    if (section) section.scrollIntoView({ behavior: 'smooth' });
  }

  static showError(message) {
    const container = document.getElementById('content');
    if (!container) { console.error(message); return; }
    container.innerHTML = `<div class="error">${Utils.escapeHtml(message)}</div>`;
  }
}