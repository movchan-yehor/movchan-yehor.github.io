// exerciseManager.js - Exercise management
class ExerciseManager {
  constructor(problems, dbMap) {
    this.problems = problems;
    this.dbMap = dbMap;
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

      const verdict = item?.solution ? this.checkAnswer(rows, item) : null;

      resultEl.innerHTML = this.renderResult(rows, verdict);

      // Store raw rows instead of HTML so re-renders stay consistent
      StorageManager.saveExerciseState(exerciseId, sql, verdict, rows);

      this.updateBadge(exercise, verdict);
    } catch (e) {
      const errorHTML = `
        <div class="result-error">
          <span class="result-error-icon">✕</span>
          <span>${Utils.escapeHtml(e.message)}</span>
        </div>
      `;
      resultEl.innerHTML = errorHTML;
      StorageManager.saveExerciseState(exerciseId, sql, 'error', []);
    }
  }

  updateBadge(exerciseEl, verdict) {
    const badge = exerciseEl.querySelector('.exercise-badge');
    if (!badge || !verdict) return;
    const icon = verdict === 'correct'
      ? '<span class="verdict-badge correct">✓</span>'
      : '<span class="verdict-badge wrong">✗</span>';
    badge.innerHTML = `SQL ${icon}`;
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

  resetExercise(exerciseId) {
    const item = this.findExercise(exerciseId);
    if (!item) return;

    const exercise = document.getElementById(`exercise-${exerciseId}`);
    exercise.querySelector('.sql-editor').value = item.initialQuery || '';
    document.getElementById(`result-${exerciseId}`).innerHTML = '';
    exercise.querySelector('.exercise-badge').innerHTML = 'SQL';

    StorageManager.clearExerciseState(exerciseId);
  }

  toggleHint(exerciseId) {
    const hint = document.getElementById(`hint-${exerciseId}`);
    if (hint) hint.classList.toggle('hidden');
  }

  showAnswer(exerciseId) {
    const item = this.findExercise(exerciseId);
    if (!item?.solution) return;
    const exercise = document.getElementById(`exercise-${exerciseId}`);
    exercise.querySelector('.sql-editor').value = item.solution;
    this.runExercise(exerciseId);
  }

  findExercise(exerciseId) {
    return this.problems.find(item => item.id === exerciseId) || null;
  }
}