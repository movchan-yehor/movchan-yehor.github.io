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

  async init() {
    try {
      // Load materials data from local JSON
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
      if (e.target.matches('.sandbox-run-btn')) {
        const sandboxId = e.target.dataset.sandboxId;
        this.runSandbox(sandboxId);
      }
      if (e.target.matches('.sandbox-reset-btn')) {
        const sandboxId = e.target.dataset.sandboxId;
        this.resetSandbox(sandboxId);
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
        if (textarea && textarea.matches('.sql-sandbox')) {
          const sandboxId = textarea.dataset.sandboxId;
          if (sandboxId) this.runSandbox(sandboxId);
        }
      }
    });

    // Auto-resize textarea on input
    document.addEventListener('input', (e) => {
      if (e.target.matches('.sql-sandbox') || e.target.matches('.sql-editor')) {
        this.autoResizeTextarea(e.target);
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

    // Auto-resize all textareas after rendering
    setTimeout(() => {
      document.querySelectorAll('.sql-editor, .sql-sandbox').forEach(textarea => {
        this.autoResizeTextarea(textarea);
      });
    }, 0);
  }


  renderSection(section) {
    // Register tables from course level
    if (this.currentCourse.tables) {
      this.registerTable(this.currentCourse.tables);
    }
    // Register tables from section level
    if (section.tables) {
      this.registerTable(section.tables);
    }

    if (section.id === 'exercises') {
      const exercisesHTML = section.content
        .filter(item => item.type === 'sql-exercise')
        .map(item => this.renderExercise(item))
        .join('');
      return `
        <section id="${section.id}" class="section exercises-section">
          <div class="section-title">${section.title}</div>
          ${exercisesHTML}
        </section>
      `;
    }

    return `
      <section id="${section.id}" class="section">
        <div class="section-title">${section.title}</div>
        ${section.content.map(item => this.renderContentItem(item, section)).join('')}
      </section>
    `;
  }

  renderContentItem(item, section) {
    switch (item.type) {
      case 'syntax':
        return `<div class="syntax-box"><code>${this.escapeHtml(item.code)}</code></div>`;
      
      case 'card':
        // Check if card has sandbox
        if (item.sandbox) {
          return this.renderCardWithSandbox(item, section);
        }
        return `
          <div class="card">
            ${item.title ? `<div class="card-title">${item.title}</div>` : ''}
            ${item.description ? `<div class="card-desc">${this.formatText(item.description)}</div>` : ''}
            ${item.code ? `<pre><code>${this.escapeHtml(item.code)}</code></pre>` : ''}
          </div>
        `;
      
      case 'two-column':
        return `
          <div class="two-col">
            ${item.items.map(card => {
              if (card.sandbox) {
                // For cards with sandbox in two-column layout, exit grid and show full width
                return '';  // Will be handled separately below
              }
              return `
                <div class="card">
                  ${card.title ? `<div class="card-title">${card.title}</div>` : ''}
                  ${card.description ? `<div class="card-desc">${this.formatText(card.description)}</div>` : ''}
                  ${card.code ? `<pre><code>${this.escapeHtml(card.code)}</code></pre>` : ''}
                </div>
              `;
            }).join('')}
          </div>
        ` + 
        // Add sandbox cards separately (full width)
        item.items.filter(card => card.sandbox).map(card => this.renderCardWithSandbox(card, section)).join('');
      
      case 'operators-grid':
        return `
          <div class="ops-grid">
            ${item.operators.map(op => `
              <div class="op-card">
                <div class="op-name">${op.name}</div>
                <div class="op-desc">${this.formatText(op.description)}</div>
                <div class="op-ex">${this.escapeHtml(op.examples)}</div>
              </div>
            `).join('')}
          </div>
        `;
      
      case 'tip':
        return `<div class="tip"><strong>Примітка:</strong> ${this.formatText(item.text)}</div>`;
      
      case 'warning':
        return `<div class="warn"><strong>Увага:</strong> ${this.formatText(item.text)}</div>`;

      default:
        return '';
    }
  }

  // ─── SQL Exercise Renderer ────────────────────────────────────────────────

  renderExercise(item) {
    const id = item.id;
    const tablesPreview = this.renderTablesPreview(
      this.currentCourse.sections
        .find(s => s.id === 'exercises')
        ?.tables ?? []
    );
    this.bindTabHandlers();
    return `
      <div class="exercise" id="exercise-${id}">
        <div class="exercise-header">
          <span class="exercise-badge">SQL</span>
          <span class="exercise-title">${this.escapeHtml(item.title || 'Завдання')}</span>
        </div>

        ${item.description ? `<div class="exercise-desc">${this.formatText(item.description)}</div>` : ''}

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

  // ─── Sandbox Renderer ─────────────────────────────────────────────────────

  renderCardWithSandbox(item, section) {
    const sandboxId = `sandbox-${Math.random().toString(36).slice(2, 9)}`;
    const exerciseTables = this.currentCourse.sections.find(s => s.id === 'exercises')?.tables ?? [];
    const tablesData = [
      ...(this.currentCourse.tables ?? []),
      ...(section?.tables ?? []),
      ...exerciseTables,
    ];

    const uniqueTables = [];
    const seenTables = new Set();
    tablesData.forEach(table => {
      if (!table || !table.tableName) return;
      if (seenTables.has(table.tableName)) return;
      seenTables.add(table.tableName);
      uniqueTables.push(table);
    });

    const tablesPreview = this.renderTablesPreview(uniqueTables);
    
    const defaultQuery = item.sandbox?.defaultQuery || item.code || '';
    
    this.bindTabHandlers();
    
    // First: show regular card with code as learning material
    const regularCard = `
      <div class="card">
        ${item.title ? `<div class="card-title">${item.title}</div>` : ''}
        ${item.description ? `<div class="card-desc">${this.formatText(item.description)}</div>` : ''}
        ${item.code ? `<pre><code>${this.escapeHtml(item.code)}</code></pre>` : ''}
      </div>
    `;
    
    // Second: show sandbox for practice
    const sandboxCard = `
      <div class="card sandbox-container" id="${sandboxId}" data-default-query="${this.escapeHtml(defaultQuery)}">
        <div class="card-title">Спробуй сам (SQL Пісочниця)</div>
        
        <div class="sandbox-box">
          ${tablesPreview}
          
          <div class="sandbox-editor-wrap">
            <div class="editor-topbar">
              <span class="editor-label">SQL Редактор</span>
              <span class="editor-hint">Ctrl+Enter — виконати</span>
            </div>
            <textarea
              class="sql-sandbox"
              data-sandbox-id="${sandboxId}"
              spellcheck="false"
              placeholder="Введіть SQL запит..."
            >${this.escapeHtml(defaultQuery)}</textarea>
          </div>
          
          <div class="sandbox-actions">
            <button class="sandbox-run-btn" data-sandbox-id="${sandboxId}">▶ Виконати</button>
            <button class="sandbox-reset-btn" data-sandbox-id="${sandboxId}">↺ Скинути</button>
          </div>
          
          <div class="sandbox-result" id="sandbox-result-${sandboxId}"></div>
        </div>
      </div>
    `;
    
    return regularCard + sandboxCard;
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

    const id = `tabs-${Math.random().toString(36).slice(2, 7)}`;

    const tabs = data.map(({ tableName }, i) => `
      <button class="tab-btn${i === 0 ? ' active' : ''}" data-tab="${id}-${i}">
        ${this.escapeHtml(tableName || `Таблиця ${i + 1}`)}
      </button>
    `).join('');

    const panels = data.map(({ tableName, data: tableData }, i) => {
      if (!tableData || !tableData.length) return `
        <div class="tab-panel${i === 0 ? ' active' : ''}" id="${id}-${i}">
          <div class="table-empty">Немає даних</div>
        </div>
      `;

      const keys = Object.keys(tableData[0]);
      const preview = tableData.slice(0, 5);
      const more = tableData.length > 5
        ? `<div class="table-more">... ще ${tableData.length - 5} рядків</div>`
        : '';

      return `
        <div class="tab-panel${i === 0 ? ' active' : ''}" id="${id}-${i}">
          <div class="table-preview-wrap">
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
        </div>
      `;
    }).join('');

    return `
      <div class="tabs-container" data-tabs="${id}">
        <div class="tab-bar">${tabs}</div>
        <div class="tab-content">${panels}</div>
      </div>
    `;
  }

  bindTabHandlers() {
    document.addEventListener('click', e => {
      const btn = e.target.closest('.tab-btn');
      if (!btn) return;

      const container = btn.closest('.tabs-container');
      const tabId = btn.dataset.tab;

      container.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      container.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));

      btn.classList.add('active');
      container.querySelector(`#${tabId}`).classList.add('active');
    });
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
    
    // Auto-resize textarea after reset
    this.autoResizeTextarea(textarea);
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
    
    // Auto-resize textarea after showing answer
    this.autoResizeTextarea(textarea);
    
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

  // ─── Sandbox Actions ──────────────────────────────────────────────────────

  runSandbox(sandboxId) {
    const container = document.getElementById(sandboxId);
    const textarea = container.querySelector('.sql-sandbox');
    const resultEl = document.getElementById(`sandbox-result-${sandboxId}`);

    const sql = textarea.value.trim();
    if (!sql) return;

    try {
      const result = alasql(sql);
      const rows = Array.isArray(result) ? result : [];

      resultEl.innerHTML = this.renderResult(rows, null); // No verdict check for sandbox
    } catch (e) {
      resultEl.innerHTML = `
        <div class="result-error">
          <span class="result-error-icon">✕</span>
          <span>${this.escapeHtml(e.message)}</span>
        </div>
      `;
    }
  }

  resetSandbox(sandboxId) {
    const container = document.getElementById(sandboxId);
    const textarea = container.querySelector('.sql-sandbox');
    const defaultQuery = container.getAttribute('data-default-query') || '';
    
    textarea.value = defaultQuery;
    document.getElementById(`sandbox-result-${sandboxId}`).innerHTML = '';
    
    // Auto-resize textarea after reset
    this.autoResizeTextarea(textarea);
  }

  // ─── Utilities ────────────────────────────────────────────────────────────

  autoResizeTextarea(textarea) {
    textarea.style.height = 'auto';
    textarea.style.height = textarea.scrollHeight + 'px';
  }

  escapeHtml(text) {
    if (text == null) return '';
    const div = document.createElement('div');
    div.textContent = String(text);
    return div.innerHTML;
  }

  formatText(text) {
    if (text == null) return '';
    return String(text).replace(/\n/g, '<br>');
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