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
    const practiceSection = practiceExercises.length > 0 ? `
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
          ${practiceExercises.length > 0 ? '<li><a class="section-link" data-section-id="exercises" href="#exercises">Практика</a></li>' : ''}
        </ul>
      </nav>

      <div class="course-sections">
        ${course.sections.map(section => this.renderSection(section)).join('')}
        ${practiceSection}
      </div>
    `;
  }

  renderSection(section) {
    if (section.id === 'exercises') {
      const exercisesHTML = this.problems
        .filter(item => item.courseid === this.currentCourse.id)
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
        ${section.content.map(item => this.renderContentItem(item)).join('')}
      </section>
    `;
  }

  renderContentItem(item) {
    switch (item.type) {
      case 'syntax':
        return `<div class="syntax-box"><code>${Utils.escapeHtml(item.code)}</code></div>`;

      case 'card':
        return `
          <div class="card">
            ${item.title ? `<div class="card-title">${item.title}</div>` : ''}
            ${item.description ? `<div class="card-desc">${Utils.formatText(item.description)}</div>` : ''}
            ${item.code ? `<pre><code>${Utils.escapeHtml(item.code)}</code></pre>` : ''}
          </div>
        `;

      case 'two-column':
        return `
          <div class="two-col">
            ${item.items.map(card => `
              <div class="card">
                ${card.title ? `<div class="card-title">${card.title}</div>` : ''}
                ${card.description ? `<div class="card-desc">${Utils.formatText(card.description)}</div>` : ''}
                ${card.code ? `<pre><code>${Utils.escapeHtml(card.code)}</code></pre>` : ''}
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
                <div class="op-desc">${Utils.formatText(op.description)}</div>
                <div class="op-ex">${Utils.escapeHtml(op.examples)}</div>
              </div>
            `).join('')}
          </div>
        `;

      case 'tip':
        return `<div class="tip"><strong>Примітка:</strong> ${Utils.formatText(item.text)}</div>`;

      case 'warning':
        return `<div class="warn"><strong>Увага:</strong> ${Utils.formatText(item.text)}</div>`;

      default:
        return '';
    }
  }

  renderExercise(item) {
    const id = item.id;
    const tables = this.getExerciseTables(item);
    const tablesPreview = this.renderTablesPreview(tables);

    // Get saved state from localStorage
    const savedState = StorageManager.getExerciseState(id);
    const savedCode = savedState?.code || item.initialQuery || '';

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

        <div class="exercise-result" id="result-${id}">${savedState?.resultHTML || ''}</div>
      </div>
    `;
  }

  getExerciseTables(item) {
    if (!item) return [];

    if (item.db && this.dbMap[item.db]) {
      return this.dbMap[item.db];
    }

    // Fallback to old section-based table structure
    const exercisesSection = this.currentCourse?.sections.find(s => s.id === 'exercises');
    if (exercisesSection && Array.isArray(exercisesSection.tables)) {
      return exercisesSection.tables;
    }

    return [];
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