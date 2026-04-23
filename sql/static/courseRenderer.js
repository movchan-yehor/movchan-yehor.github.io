// courseRenderer.js - Course rendering
class CourseRenderer {
  constructor(data, problems, dbMap) {
    this.data = data;
    this.problems = problems;
    this.dbMap = dbMap;
    this.currentCourse = null;
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

    const practiceExercises = this.problems.filter(item => item.courseid === course.id);
    const hasPractice = practiceExercises.length > 0;

    const practiceSection = hasPractice ? `
      <section id="exercises" class="section exercises-section">
        <div class="section-title">Практика</div>
        ${practiceExercises.map(item => this.renderExercise(item)).join('')}
      </section>
    ` : '';

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
          ${hasPractice ? '<li><a class="section-link" data-section-id="exercises" href="#exercises">Практика</a></li>' : ''}
        </ul>
      </nav>

      <div class="course-sections">
        ${course.sections.map(section => this.renderSection(section)).join('')}
        ${practiceSection}
      </div>
    `;
  }

  renderSection(section) {
    let html = `
      <section id="${section.id}" class="section">
        <div class="section-title">${section.title}</div>
    `;

    if (section.syntax) {
      html += `<div class="syntax-box"><code>${Utils.escapeHtml(section.syntax)}</code></div>`;
    }

    if (section.warning) {
      html += `<div class="warn"><strong>Увага:</strong> ${Utils.formatText(section.warning)}</div>`;
    }

    if (section.tip) {
      html += `<div class="tip"><strong>Примітка:</strong> ${Utils.formatText(section.tip)}</div>`;
    }

    if (section.operators) {
      html += this.renderOperatorsGrid(section.operators);
    }

    if (section.examples) {
      html += section.examples.map(ex => this.renderExample(ex)).join('');
    }

    html += '</section>';
    return html;
  }

  renderExample(ex) {
    // Two-column comparison layout (e.g. LEFT JOIN vs RIGHT JOIN)
    if (ex.columns) {
      return `
        <div class="two-col">
          ${ex.columns.map(col => this.renderExample(col)).join('')}
        </div>
      `;
    }

    return `
      <div class="card">
        ${ex.title       ? `<div class="card-title">${ex.title}</div>` : ''}
        ${ex.description ? `<div class="card-desc">${Utils.formatText(ex.description)}</div>` : ''}
        ${ex.code        ? `<pre><code>${Utils.escapeHtml(ex.code)}</code></pre>` : ''}
      </div>
    `;
  }

  renderOperatorsGrid(operators) {
    return `
      <div class="ops-grid">
        ${operators.map(op => `
          <div class="op-card">
            <div class="op-name">${op.name}</div>
            <div class="op-desc">${Utils.formatText(op.description)}</div>
            <div class="op-ex">${Utils.escapeHtml(op.example)}</div>
          </div>
        `).join('')}
      </div>
    `;
  }

  renderExercise(item) {
    const id = item.id;
    const tables = item.db && this.dbMap[item.db] ? this.dbMap[item.db] : [];
    const tablesPreview = this.renderTablesPreview(tables);

    const savedState = StorageManager.getExerciseState(id);
    const savedCode = savedState?.code || item.initialQuery || '';

    // Re-render result from raw rows instead of stored HTML
    const savedResultHTML = savedState?.rows?.length
      ? this.renderResultFromState(savedState)
      : '';

    return `
      <div class="exercise" id="exercise-${id}">
        <div class="exercise-header">
          <span class="exercise-badge">SQL ${savedState?.verdict ? `<span class="verdict-badge ${savedState.verdict}">${savedState.verdict === 'correct' ? '✓' : '✗'}</span>` : ''}</span>
          <span class="exercise-title">${Utils.escapeHtml(item.title || 'Завдання')}</span>
        </div>

        ${item.description ? `<div class="exercise-desc">${Utils.formatText(item.description)}</div>` : ''}

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
          >${Utils.escapeHtml(savedCode)}</textarea>
        </div>

        <div class="exercise-actions">
          <button class="run-btn" data-exercise-id="${id}">▶ Виконати</button>
          <button class="reset-btn" data-exercise-id="${id}">↺ Скинути</button>
        </div>

        <div class="exercise-result" id="result-${id}">${savedResultHTML}</div>
      </div>
    `;
  }

  // Renders saved exercise result from raw rows (not from stored HTML)
  renderResultFromState(savedState) {
    const { rows, verdict } = savedState;
    if (!rows?.length) return '';

    const keys = Object.keys(rows[0]);
    const verdictHTML = verdict === 'correct'
      ? `<div class="result-verdict correct">✓ Правильно!</div>`
      : verdict === 'wrong'
      ? `<div class="result-verdict wrong">✗ Не зовсім — перевір умову ще раз</div>`
      : '';

    const rowWord = rows.length === 1 ? '' : rows.length < 5 ? 'и' : 'ів';

    return `
      ${verdictHTML}
      <div class="result-meta">${rows.length} рядк${rowWord}</div>
      <div class="result-table-wrap">
        <table class="result-table">
          <thead><tr>${keys.map(k => `<th>${Utils.escapeHtml(k)}</th>`).join('')}</tr></thead>
          <tbody>
            ${rows.map(row => `
              <tr>${keys.map(k => `<td>${row[k] ?? '<span class="null-val">NULL</span>'}</td>`).join('')}</tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  renderTablesPreview(data) {
    if (!data || !data.length) return '';

    const id = `tabs-${Math.random().toString(36).slice(2, 7)}`;

    const tabs = data.map(({ tableName }, i) => `
      <button class="tab-btn${i === 0 ? ' active' : ''}" data-tab="${id}-${i}">
        ${Utils.escapeHtml(tableName || `Таблиця ${i + 1}`)}
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
              <thead><tr>${keys.map(k => `<th>${Utils.escapeHtml(k)}</th>`).join('')}</tr></thead>
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
}