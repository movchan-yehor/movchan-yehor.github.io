// SQL Materials SPA
class SQLMaterialsSPA {
  constructor() {
    this.data = null;
    this.currentCourse = null;
    this.initTheme();
    this.loadAlaSQL().then(() => this.init());
  }

  loadAlaSQL() {
    return new Promise((resolve) => {
      if (window.alasql) return resolve();
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/alasql/4.2.0/alasql.min.js';
      script.onload = resolve;
      document.head.appendChild(script);
    });
  }

  initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'dark';
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

  async init() {
    try {
      const response = await fetch('./sql/data/materials.json');
      this.data = await response.json();
      
      this.setupEventListeners();
      this.renderCourseList();
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
      if (e.target.matches('.run-btn')) {
        const exerciseId = e.target.dataset.exerciseId;
        this.runExercise(exerciseId);
      }
      if (e.target.matches('.reset-btn')) {
        const exerciseId = e.target.dataset.exerciseId;
        this.resetExercise(exerciseId);
      }
      if (e.target.matches('.hint-btn')) {
        const exerciseId = e.target.dataset.exerciseId;
        this.toggleHint(exerciseId);
      }
      if (e.target.matches('.show-answer-btn')) {
        const exerciseId = e.target.dataset.exerciseId;
        this.showAnswer(exerciseId);
      }
    });

    // Ctrl+Enter to run SQL in focused editor
    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        const textarea = document.activeElement;
        if (textarea && textarea.matches('.sql-editor')) {
          const exerciseId = textarea.dataset.exerciseId;
          if (exerciseId) this.runExercise(exerciseId);
        }
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
    
    document.querySelectorAll('.course-btn').forEach((btn, idx) => {
      btn.classList.toggle('active', idx === parseInt(index));
    });

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

  // FIX 1: Removed extra `}` at the end of the ternary expression.
  // FIX 2 & 3: Exercises section now iterates over content items individually,
  //            passing each exercise object directly — no global counter needed.
  renderSection(section) {
    if (section.id === 'exercises') {
      this.registerTable(section.tables);
      const exercisesHTML = section.content
        .filter(item => item.type === 'sql-exercise')
        .map(item => this.renderExercise(item))
        .join('');
      return `
        <section id="${section.id}" class="section">
          <div class="section-title">${section.title}</div>
          ${exercisesHTML}
        </section>
      `;
    }

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

  // ─── SQL Exercise Renderer ────────────────────────────────────────────────

  // FIX 3: Now receives a single exercise item directly instead of a whole section.
  renderExercise(item) {
    const id = item.id;
    const tablesPreview = this.renderTablesPreview(
      this.currentCourse.sections
        .find(s => s.id === 'exercises')
        ?.tables ?? []
    );

    return `
      <div class="exercise" id="exercise-${id}">
        <div class="exercise-header">
          <span class="exercise-badge">SQL</span>
          <span class="exercise-title">${this.escapeHtml(item.title || 'Завдання')}</span>
        </div>

        ${item.description ? `<div class="exercise-desc">${item.description}</div>` : ''}

        <div class="exercise-data">
          ${tablesPreview}
        </div>

        <div class="exercise-editor-wrap">
          <div class="editor-topbar">
            <span class="editor-label">SQL</span>
            <span class="editor-hint">Ctrl+Enter — виконати</span>
          </div>
          <textarea
            class="sql-editor"
            data-exercise-id="${id}"
            spellcheck="false"
            placeholder="Введіть SQL запит..."
          ></textarea>
        </div>

        <div class="exercise-actions">
          <button class="run-btn" data-exercise-id="${id}">▶ Виконати</button>
          <button class="reset-btn" data-exercise-id="${id}">↺ Скинути</button>
        </div>

        <div class="exercise-result" id="result-${id}"></div>
      </div>
    `;
  }

  registerTable(tables) {
    if (!tables || !tables.length) return;
    tables.forEach(table => {
      try {
        alasql(`DROP TABLE IF EXISTS \`${table.tableName}\``);
        alasql(`CREATE TABLE \`${table.tableName}\``);
        alasql.tables[table.tableName].data = JSON.parse(JSON.stringify(table.data));
      } catch (e) {
        console.warn('Table registration error:', e);
      }
    });
  }

  renderTablesPreview(data) {
    if (!data || !data.length) return '';

    return data.map(({ tableName, data: tableData }) => {
      if (!tableData || !tableData.length) return '';

      const keys = Object.keys(tableData[0]);
      const preview = tableData.slice(0, 5);
      const more = tableData.length > 5
        ? `<div class="table-more">... ще ${tableData.length - 5} рядків</div>`
        : '';

      return `
        <div class="table-preview-wrap">
          ${tableName ? `<div class="table-name">${this.escapeHtml(tableName)}</div>` : ''}
          <table class="table-preview">
            <thead><tr>${keys.map(k => `<th>${this.escapeHtml(k)}</th>`).join('')}</tr></thead>
            <tbody>
              ${preview.map(row => `
                <tr>${keys.map(k => `<td>${row[k] ?? '<span class="null-val">NULL</span>'}</td>`).join('')}</tr>
              `).join('')}
            </tbody>
          </table>
          ${more}
        </div>
      `;
    }).join('');
  }

  // ─── Exercise Actions ─────────────────────────────────────────────────────

  // FIX 4: Removed table name replacement logic entirely.
  //        SQL runs against the original registered table name as-is.
  runExercise(exerciseId) {
    const exercise = document.getElementById(`exercise-${exerciseId}`);
    const textarea = exercise.querySelector('.sql-editor');
    const resultEl = document.getElementById(`result-${exerciseId}`);
    const item = this.findExercise(exerciseId);

    const sql = textarea.value.trim();
    if (!sql) return;

    try {
      const result = alasql(sql);
      const rows = Array.isArray(result) ? result : [];

      let verdict = null;
      if (item?.solution) {
        verdict = this.checkAnswer(rows, item);
      }

      resultEl.innerHTML = this.renderResult(rows, verdict);
    } catch (e) {
      resultEl.innerHTML = `
        <div class="result-error">
          <span class="result-error-icon">✕</span>
          <span>${this.escapeHtml(e.message)}</span>
        </div>
      `;
    }
  }

  checkAnswer(result, item) {
    const expected = item.solution;

    if (!Array.isArray(expected)) return null;
    if (result.length !== expected.length) return 'wrong';

    const normalizeRow = (row) =>
      Object.fromEntries(
        Object.entries(row).map(([k, v]) => [k.toLowerCase(), String(v ?? '').toLowerCase()])
      );

    for (let i = 0; i < expected.length; i++) {
      const resultRow   = normalizeRow(result[i]);
      const expectedRow = normalizeRow(expected[i]);

      const resultKeys   = Object.keys(resultRow).sort();
      const expectedKeys = Object.keys(expectedRow).sort();

      if (JSON.stringify(resultKeys) !== JSON.stringify(expectedKeys)) return 'wrong';
      for (const key of expectedKeys) {
        if (resultRow[key] !== expectedRow[key]) return 'wrong';
      }
    }

    return 'correct';
  }

  renderResult(rows, verdict) {
    if (!rows.length) {
      return `<div class="result-empty">Запит виконано. Результатів немає.</div>`;
    }

    const keys = Object.keys(rows[0]);
    const verdictHTML = verdict === 'correct'
      ? `<div class="result-verdict correct">✓ Правильно!</div>`
      : verdict === 'wrong'
      ? `<div class="result-verdict wrong">✗ Не зовсім — перевір умову ще раз</div>`
      : '';

    return `
      ${verdictHTML}
      <div class="result-meta">${rows.length} рядк${rows.length === 1 ? '' : rows.length < 5 ? 'и' : 'ів'}</div>
      <div class="result-table-wrap">
        <table class="result-table">
          <thead><tr>${keys.map(k => `<th>${this.escapeHtml(k)}</th>`).join('')}</tr></thead>
          <tbody>
            ${rows.map(row => `
              <tr>${keys.map(k => `<td>${row[k] ?? '<span class="null-val">NULL</span>'}</td>`).join('')}</tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  resetExercise(exerciseId) {
    const item = this.findExercise(exerciseId);
    if (!item) return;
    const exercise = document.getElementById(`exercise-${exerciseId}`);
    const textarea = exercise.querySelector('.sql-editor');
    textarea.value = item.initialQuery || '';
    document.getElementById(`result-${exerciseId}`).innerHTML = '';
  }

  toggleHint(exerciseId) {
    const hint = document.getElementById(`hint-${exerciseId}`);
    if (hint) hint.classList.toggle('hidden');
  }

  showAnswer(exerciseId) {
    const item = this.findExercise(exerciseId);
    if (!item?.solution) return;
    const exercise = document.getElementById(`exercise-${exerciseId}`);
    const textarea = exercise.querySelector('.sql-editor');
    textarea.value = item.solution;
    this.runExercise(exerciseId);
  }

  findExercise(exerciseId) {
    if (!this.currentCourse) return null;
    for (const section of this.currentCourse.sections) {
      for (const item of section.content) {
        if (item.type === 'sql-exercise' && item.id === exerciseId) return item;
      }
    }
    return null;
  }

  // ─── Utilities ────────────────────────────────────────────────────────────

  escapeHtml(text) {
    if (text == null) return '';
    const div = document.createElement('div');
    div.textContent = String(text);
    return div.innerHTML;
  }

  scrollToSection(id) {
    const section = document.getElementById(id);
    if (section) section.scrollIntoView({ behavior: 'smooth' });
  }

  showError(message) {
    const container = document.getElementById('content');
    container.innerHTML = `<div class="error">${message}</div>`;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new SQLMaterialsSPA();
});