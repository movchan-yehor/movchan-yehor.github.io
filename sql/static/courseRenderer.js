class CourseRenderer {
  constructor(options = {}) {
    this.container = options.container || document.getElementById('content');
    this.nav = options.nav || document.querySelector('.course-nav');
    this.dataUrl = options.dataUrl || './data/materials_test.json';
    this.courses = {};
    this.currentCourseKey = options.currentCourseKey || null;
  }

  async init() {
    if (!this.container || !this.nav) {
      console.warn('CourseRenderer: required DOM nodes were not found');
      return;
    }

    try {
      const data = await this.loadData();
      this.courses = data.courses || {};
      this.currentCourseKey = this.currentCourseKey || Object.keys(this.courses)[0] || null;
      this.renderNavigation();
      this.renderCurrentCourse();
      this.bindNavigation();
    } catch (error) {
      console.error('CourseRenderer: failed to initialize', error);
      if (this.container) {
        this.container.innerHTML = `<div class="error">Не вдалося завантажити матеріали курсу.</div>`;
      }
    }
  }

  async loadData() {
    const response = await fetch(this.dataUrl, { cache: 'no-store' });
    if (!response.ok) {
      throw new Error(`Failed to fetch ${this.dataUrl}: ${response.status}`);
    }
    return response.json();
  }

  renderNavigation() {
    if (!this.nav) return;

    const keys = Object.keys(this.courses);
    if (!keys.length) return;

    this.nav.innerHTML = keys.map((key) => {
      const course = this.courses[key];
      const isActive = key === this.currentCourseKey;
      return `<button class="course-btn${isActive ? ' active' : ''}" data-course-key="${key}">${this.escapeHtml(course.title || key)}</button>`;
    }).join('');
  }

  renderCurrentCourse() {
    if (!this.currentCourseKey || !this.courses[this.currentCourseKey]) return;
    const course = this.courses[this.currentCourseKey];
    this.container.innerHTML = this.buildCourseMarkup(course);
    this.refreshActiveButton();
  }

  bindNavigation() {
    this.nav?.querySelectorAll('[data-course-key]').forEach((button) => {
      button.addEventListener('click', () => {
        this.currentCourseKey = button.getAttribute('data-course-key');
        this.renderCurrentCourse();
      });
    });
  }

  refreshActiveButton() {
    if (!this.nav) return;
    this.nav.querySelectorAll('.course-btn').forEach((button) => {
      const isActive = button.getAttribute('data-course-key') === this.currentCourseKey;
      button.classList.toggle('active', isActive);
    });
  }

  buildCourseMarkup(course) {
    const sections = course.sections || {};
    const tocItems = Object.entries(sections).map(([key, section]) => {
      const title = section && section.title ? section.title : key;
      return `<li><a class="section-link" href="#section-${key}">${this.escapeHtml(title)}</a></li>`;
    }).join('');

    const sectionMarkup = Object.entries(sections).map(([key, section]) => this.buildSectionMarkup(key, section)).join('');

    return `
      <article class="course-content">
        <div class="course-header">
          <h1>${this.escapeHtml(course.title || 'SQL курс')}</h1>
        </div>
        <div class="toc">
          <h3>Зміст</h3>
          <ul>${tocItems}</ul>
        </div>
        <div class="course-sections">${sectionMarkup}</div>
      </article>
    `;
  }

  buildSectionMarkup(key, section) {
    if (!section) return '';

    const parts = [];

    if (section.syntax) {
      parts.push(`<div class="syntax-box"><code>${this.escapeHtml(section.syntax)}</code></div>`);
    }

    if (section.tip) {
      parts.push(`<div class="tip"><strong>Порада:</strong> ${this.escapeHtml(section.tip)}</div>`);
    }

    if (section.warning) {
      parts.push(`<div class="warn"><strong>Увага:</strong> ${this.escapeHtml(section.warning)}</div>`);
    }

    if (Array.isArray(section.examples) && section.examples.length) {
      parts.push(this.buildExamplesMarkup(section.examples));
    }

    if (Array.isArray(section.operators) && section.operators.length) {
      parts.push(this.buildOperatorsMarkup(section.operators));
    }

    return `
      <section class="section" id="section-${key}">
        <h2 class="section-title">${this.escapeHtml(section.title || key)}</h2>
        ${parts.join('')}
      </section>
    `;
  }

  buildExamplesMarkup(examples) {
    return examples.map((example, index) => {
      const title = example.title ? `<h3 class="card-title">${this.escapeHtml(example.title)}</h3>` : '';
      const description = example.description ? `<p class="card-desc">${this.escapeHtml(example.description)}</p>` : '';
      const code = example.code ? `<pre><code>${this.escapeHtml(example.code)}</code></pre>` : '';

      if (Array.isArray(example.columns) && example.columns.length) {
        const columnsMarkup = example.columns.map((column) => `
          <div class="card">
            ${column.title ? `<h3 class="card-title">${this.escapeHtml(column.title)}</h3>` : ''}
            ${column.description ? `<p class="card-desc">${this.escapeHtml(column.description)}</p>` : ''}
            ${column.code ? `<pre><code>${this.escapeHtml(column.code)}</code></pre>` : ''}
          </div>
        `).join('');
        return `<div class="two-col">${columnsMarkup}</div>`;
      }

      return `
        <div class="card">
          ${title}
          ${description}
          ${code}
        </div>
      `;
    }).join('');
  }

  buildOperatorsMarkup(operators) {
    const cards = operators.map((operator) => `
      <div class="op-card">
        <div class="op-name">${this.escapeHtml(operator.name || '')}</div>
        <div class="op-desc">${this.escapeHtml(operator.description || '')}</div>
        <div class="op-ex">${this.escapeHtml(operator.example || '')}</div>
      </div>
    `).join('');

    return `<div class="ops-grid">${cards}</div>`;
  }

  escapeHtml(text) {
    if (typeof window !== 'undefined' && window.Utils?.escapeHtml) {
      return window.Utils.escapeHtml(text);
    }

    if (text == null) return '';
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
}

window.CourseRenderer = CourseRenderer;
