// SQL Materials SPA
class SQLMaterialsSPA {
  constructor() {
    this.data = null;
    this.currentCourse = null;
    this.init();
  }

  async init() {
    try {
      // Load materials data from local JSON
      const response = await fetch('./sql/data/materials.json');
      this.data = await response.json();
      
      this.setupEventListeners();
      this.renderCourseList();
      
      // Load first course by default
      this.loadCourse(0);
    } catch (error) {
      console.error('Error loading materials:', error);
      this.showError('Не вдалось завантажити матеріали');
    }
  }

  setupEventListeners() {
    document.addEventListener('click', (e) => {
      if (e.target.matches('.course-btn')) {
        const index = e.target.dataset.courseIndex;
        this.loadCourse(index);
      }
      if (e.target.matches('.section-link')) {
        const sectionId = e.target.dataset.sectionId;
        this.scrollToSection(sectionId);
      }
    });
  }

  renderCourseList() {
    const nav = document.querySelector('.course-nav');
    nav.innerHTML = this.data.courses.map((course, idx) => `
      <button class="course-btn ${idx === 0 ? 'active' : ''}" data-course-index="${idx}">
        ${course.title}
      </button>
    `).join('');
  }

  loadCourse(index) {
    if (!this.data.courses[index]) return;
    
    this.currentCourse = this.data.courses[index];
    
    // Update active button
    document.querySelectorAll('.course-btn').forEach((btn, idx) => {
      btn.classList.toggle('active', idx === parseInt(index));
    });

    // Render course content
    this.renderCourse();
  }

  renderCourse() {
    const container = document.getElementById('content');
    const course = this.currentCourse;

    container.innerHTML = `
      <div class="course-header">
        <h1>${course.title}</h1>
        <p class="subtitle">${course.subtitle}</p>
      </div>
      
      <nav class="toc">
        <h3>Зміст</h3>
        <ul>
          ${course.sections.map(s => `
            <li><a class="section-link" data-section-id="${s.id}" href="#${s.id}">${s.title}</a></li>
          `).join('')}
        </ul>
      </nav>

      <div class="course-sections">
        ${course.sections.map(section => this.renderSection(section)).join('')}
      </div>
    `;
  }

  renderSection(section) {
    return `
      <section id="${section.id}" class="section">
        <div class="section-title">${section.title}</div>
        ${section.content.map(item => this.renderContentItem(item)).join('')}
      </section>
    `;
  }

  renderContentItem(item) {
    switch (item.type) {
      case 'syntax':
        return `<div class="syntax-box"><code>${this.escapeHtml(item.code)}</code></div>`;
      
      case 'card':
        return `
          <div class="card">
            ${item.title ? `<div class="card-title">${item.title}</div>` : ''}
            ${item.description ? `<div class="card-desc">${item.description}</div>` : ''}
            ${item.code ? `<pre><code>${this.escapeHtml(item.code)}</code></pre>` : ''}
          </div>
        `;
      
      case 'two-column':
        return `
          <div class="two-col">
            ${item.items.map(card => `
              <div class="card">
                ${card.title ? `<div class="card-title">${card.title}</div>` : ''}
                ${card.description ? `<div class="card-desc">${card.description}</div>` : ''}
                ${card.code ? `<pre><code>${this.escapeHtml(card.code)}</code></pre>` : ''}
              </div>
            `).join('')}
          </div>
        `;
      
      case 'operators-grid':
        return `
          <div class="ops-grid">
            ${item.operators.map(op => `
              <div class="op-card">
                <div class="op-name">${op.name}</div>
                <div class="op-desc">${op.description}</div>
                <div class="op-ex">${this.escapeHtml(op.examples)}</div>
              </div>
            `).join('')}
          </div>
        `;
      
      case 'tip':
        return `<div class="tip"><strong>Примітка:</strong> ${item.text}</div>`;
      
      case 'warning':
        return `<div class="warn"><strong>Увага:</strong> ${item.text}</div>`;
      
      default:
        return '';
    }
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  scrollToSection(id) {
    const section = document.getElementById(id);
    if (section) {
      section.scrollIntoView({ behavior: 'smooth' });
    }
  }

  showError(message) {
    const container = document.getElementById('content');
    container.innerHTML = `<div class="error">${message}</div>`;
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new SQLMaterialsSPA();
});
