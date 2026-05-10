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
  static async getSHA256Hash(input) {
    const cleanString = JSON.stringify(input);
    const encoder = new TextEncoder();
    const data = encoder.encode(cleanString); // в UTF-8
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    
    // Конвертуємо Buffer в Hex-рядок
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }
}