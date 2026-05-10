// exerciseManager.js - Exercise management
class ExerciseManager {
  constructor(problems, dbMap) {
    this.problems = problems;
    this.dbMap = dbMap;
  }

  // Registers all tables from a given db into AlaSQL.
  // Called before every query run to ensure tables are always present.
  registerTables(dbName) {
    const tables = this.dbMap[dbName];
    if (!tables?.length) return;

    tables.forEach(table => {
      try {
        alasql(`DROP TABLE IF EXISTS \`${table.tableName}\``);
        alasql(`CREATE TABLE \`${table.tableName}\``);
        alasql.tables[table.tableName].data = JSON.parse(JSON.stringify(table.data));
      } catch (e) {
        console.warn(`Table registration error [${table.tableName}]:`, e);
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

    // Always re-register tables before running so AlaSQL state is fresh
    if (item?.db) {
      this.registerTables(item.db);
    }

    try {
      const result = alasql(sql);
      const resultString = JSON.stringify(result);
      let verdict = null;
      Utils.getSHA256Hash(resultString).then(hash => {
        verdict = item?.solution === hash ? 'correct' : 'wrong';
      });

      resultEl.innerHTML = this.renderResult(rows, verdict);

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