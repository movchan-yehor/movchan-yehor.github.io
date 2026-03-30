const data = [
  { id: 1, name: 'Олена Коваль',   age: 28, city: 'Київ',    salary: 55000, dept: 'IT' },
  { id: 2, name: 'Микола Бондар',  age: 34, city: 'Харків',  salary: 48000, dept: 'HR' },
  { id: 3, name: 'Тетяна Мороз',   age: 22, city: 'Київ',    salary: 38000, dept: 'IT' },
  { id: 4, name: 'Іван Шевченко',  age: 41, city: 'Одеса',   salary: 72000, dept: 'Фінанси' },
  { id: 5, name: 'Анна Павленко',  age: 29, city: 'Київ',    salary: 61000, dept: 'IT' },
  { id: 6, name: 'Сергій Лисенко', age: 37, city: 'Харків',  salary: 44000, dept: 'HR' },
  { id: 7, name: 'Юлія Дмитренко', age: 25, city: 'Одеса',   salary: 39000, dept: 'IT' },
];

function renderTable(rows, containerId) {
  if (!rows || rows.length === 0) {
    document.getElementById(containerId).innerHTML = '<p style="padding:12px; font-size:13px; color:var(--color-text-secondary);">Результатів немає</p>';
    return;
  }
  const keys = Object.keys(rows[0]);
  let html = '<table><thead><tr>' + keys.map(k => `<th>${k}</th>`).join('') + '</tr></thead><tbody>';
  rows.forEach(r => {
    html += '<tr>' + keys.map(k => `<td>${r[k] ?? ''}</td>`).join('') + '</tr>';
  });
  html += '</tbody></table>';
  document.getElementById(containerId).innerHTML = html;
}

function setQ(q) {
  document.getElementById('sql').value = q;
}

function run() {
  const sql = document.getElementById('sql').value.trim();
  const msg = document.getElementById('msg');
  const out = document.getElementById('out');
  msg.style.display = 'none';
  out.style.display = 'none';

  try {
    const result = alasql(sql, [data]);
    const rows = Array.isArray(result) ? result : [];
    msg.className = 'msg ok';
    msg.textContent = `Знайдено ${rows.length} рядк${rows.length === 1 ? '' : rows.length < 5 ? 'и' : 'ів'}`;
    msg.style.display = 'block';
    out.style.display = 'block';
    renderTable(rows, 'out');
  } catch(e) {
    msg.className = 'msg err';
    msg.textContent = 'Помилка: ' + e.message;
    msg.style.display = 'block';
  }
}

renderTable(data, 'table');
run();