document.addEventListener('DOMContentLoaded', () => {
    const taskList = document.getElementById('taskList');
    const tagFiltersContainer = document.getElementById('tagFilters');
    const clearFiltersButton = document.getElementById('clearFilters');
    const problemsUrl = './data/problems.json';
    const materialsUrl = './data/materials.json';
    let allTasks = [];
    let allMaterials = [];
    let selectedDate = null;

    function createTaskItem(task, index) {
        const li = document.createElement('li');
        li.className = 'task-item';

        const header = document.createElement('div');
        header.className = 'task-header';

        const title = document.createElement('span');
        title.textContent = `${index + 1}. ${task.name}`;

        header.appendChild(title);

        const description = document.createElement('p');
        description.className = 'task-description';
        description.textContent = task.description || '';

        const examplesWrap = document.createElement('div');
        examplesWrap.className = 'task-examples';

        if (Array.isArray(task.examples) && task.examples.length > 0) {
            task.examples.forEach((ex) => {
                const exBlock = document.createElement('div');
                exBlock.className = 'task-example';

                const inputLine = document.createElement('p');
                inputLine.innerHTML = `<strong>Введені дані:</strong> ${ex.input}`;

                const outputLine = document.createElement('p');
                outputLine.innerHTML = `<strong>Результат:</strong> ${ex.output}`;

                exBlock.appendChild(inputLine);
                exBlock.appendChild(outputLine);
                examplesWrap.appendChild(exBlock);
            });
        } else {
            const empty = document.createElement('p');
            empty.textContent = 'Приклади відсутні';
            examplesWrap.appendChild(empty);
        }

        li.appendChild(header);
        li.appendChild(description);
        li.appendChild(examplesWrap);

        return li;
    }

    function createMaterialItem(material, index) {
        const li = document.createElement('li');
        li.className = 'task-item material-item';

        const header = document.createElement('div');
        header.className = 'task-header';

        const title = document.createElement('span');
        title.textContent = `📚 ${index + 1}. ${material.topic}`;
        title.style.fontSize = '1.1em';
        title.style.fontWeight = 'bold';

        header.appendChild(title);

        const description = document.createElement('p');
        description.className = 'task-description';
        description.textContent = material.description || '';

        const contentWrap = document.createElement('div');
        contentWrap.className = 'material-content';

        if (Array.isArray(material.content) && material.content.length > 0) {
            material.content.forEach((section) => {
                const sectionDiv = document.createElement('div');
                sectionDiv.className = 'material-section';

                const sectionTitle = document.createElement('h3');
                sectionTitle.textContent = section.section;
                sectionTitle.style.marginTop = '12px';
                sectionTitle.style.marginBottom = '8px';
                sectionTitle.style.color = '#2c5aa0';

                sectionDiv.appendChild(sectionTitle);

                if (Array.isArray(section.details)) {
                    const detailsList = document.createElement('ul');
                    detailsList.style.marginLeft = '20px';

                    section.details.forEach((detail) => {
                        const li = document.createElement('li');
                        li.style.marginBottom = '8px';

                        // Динамічне створення вмісту залежно від типу деталі
                        let content = '';
                        if (detail.action) {
                            content = `<strong>${detail.action}:</strong> ${detail.example}`;
                            if (detail.note) {
                                content += ` <em>(${detail.note})</em>`;
                            }
                        } else if (detail.method) {
                            content = `<strong>${detail.method}</strong> — ${detail.syntax}`;
                            if (detail.desc) {
                                content += ` — ${detail.desc}`;
                            }
                        } else if (detail.type) {
                            content = `<strong>${detail.type}:</strong> <code>${detail.code}</code> — ${detail.desc}`;
                        } else if (detail.feature) {
                            content = `<strong>${detail.feature}:</strong> <code>${detail.example}</code> — ${detail.desc}`;
                        }

                        li.innerHTML = content;
                        detailsList.appendChild(li);
                    });

                    sectionDiv.appendChild(detailsList);
                }

                contentWrap.appendChild(sectionDiv);
            });
        }

        li.appendChild(header);
        li.appendChild(description);
        li.appendChild(contentWrap);

        return li;
    }

    function getActiveTags() {
        const checked = Array.from(tagFiltersContainer.querySelectorAll('input[type="checkbox"]:checked'));
        return checked.map(el => el.value);
    }

    function sortByDifficulty(tasks) {
        const orderMap = {
            'Легкий': 1,
            'Середній': 2,
            'Складний': 3
        };

        const direction = 'ascending';
        const multiplier = 1;

        return [...tasks].sort((a, b) => {
            const aVal = orderMap[a.difficulty] || 0;
            const bVal = orderMap[b.difficulty] || 0;
            return multiplier * (aVal - bVal);
        });
    }

    function renderTasks(tasks, materials) {
        const selectedTags = getActiveTags();
        let filteredTasks = selectedTags.length === 0
            ? tasks
            : tasks.filter(task => Array.isArray(task.tags) && selectedTags.every(tag => task.tags.includes(tag)));

        if (selectedDate) {
            filteredTasks = filteredTasks.filter(task => task.date === selectedDate);
        }

        let filteredMaterials = [];
        if (selectedDate) {
            filteredMaterials = materials.filter(material => material.date === selectedDate);
        }

        const sortedTasks = sortByDifficulty(filteredTasks);

        taskList.innerHTML = '';

        let hasContent = false;

        // Додаємо матеріали спочатку
        if (filteredMaterials.length > 0) {
            hasContent = true;
            filteredMaterials.forEach((material, idx) => {
                const materialItem = createMaterialItem(material, idx);
                taskList.appendChild(materialItem);
            });
        }

        // Потім додаємо завдання
        if (sortedTasks.length > 0) {
            hasContent = true;
            sortedTasks.forEach((task, idx) => {
                const taskItem = createTaskItem(task, idx);
                taskList.appendChild(taskItem);
            });
        }

        if (!hasContent) {
            taskList.innerHTML = '<li>Контент не знайдений за обраними критеріями</li>';
        }
    }

    function renderTagFilters(tasks) {
        const tagsSet = new Set();
        tasks.forEach(task => {
            if (Array.isArray(task.tags)) {
                task.tags.forEach(tag => tagsSet.add(tag));
            }
        });

        const tags = Array.from(tagsSet).sort((a, b) => a.localeCompare(b, 'uk'));

        tagFiltersContainer.innerHTML = '';

        tags.forEach(tag => {
            const label = document.createElement('label');
            label.style.display = 'flex';
            label.style.alignItems = 'center';
            label.style.gap = '6px';
            const input = document.createElement('input');
            input.type = 'checkbox';
            input.value = tag;
            input.addEventListener('change', () => renderTasks(allTasks, allMaterials));

            const span = document.createElement('span');
            span.textContent = tag;

            label.appendChild(input);
            label.appendChild(span);
            tagFiltersContainer.appendChild(label);
        });
    }

    clearFiltersButton.addEventListener('click', () => {
        const inputs = tagFiltersContainer.querySelectorAll('input[type="checkbox"]');
        inputs.forEach(input => { input.checked = false; });
        renderTasks(allTasks, allMaterials);
    });

    // Завантажуємо обидва файли паралельно
    Promise.all([
        fetch(problemsUrl).then(response => {
            if (!response.ok) { throw new Error(`HTTP error ${response.status}`); }
            return response.json();
        }),
        fetch(materialsUrl).then(response => {
            if (!response.ok) { throw new Error(`HTTP error ${response.status}`); }
            return response.json();
        })
    ])
    .then(([problems, materialsData]) => {
        if (!Array.isArray(problems) || problems.length === 0) {
            console.warn('Проблеми не знайдені');
        } else {
            allTasks = problems;
        }

        // Якщо materials це масив об'єктів з однією машиною
        if (materialsData && !Array.isArray(materialsData)) {
            // Це одна машина, оберніть в масив
            allMaterials = [materialsData];
        } else if (Array.isArray(materialsData)) {
            allMaterials = materialsData;
        }

        // Отримуємо всі унікальні дати з обох наборів
        const tasksDateSet = new Set(allTasks.map(task => task.date));
        const materialsDateSet = new Set(allMaterials.map(material => material.date));
        const uniqueDates = [...new Set([...tasksDateSet, ...materialsDateSet])].sort((a, b) => {
            const [dayA, monthA, yearA] = a.split('.').map(Number);
            const [dayB, monthB, yearB] = b.split('.').map(Number);
            return new Date(yearA, monthA - 1, dayA) - new Date(yearB, monthB - 1, dayB);
        });

        const tabsContainer = document.getElementById('dateTabs');
        tabsContainer.innerHTML = '';

        if (uniqueDates.length === 0) {
            taskList.innerHTML = '<li>Контент не знайдений</li>';
            return;
        }

        uniqueDates.forEach(date => {
            const tab = document.createElement('button');
            tab.className = 'tab';
            tab.textContent = date;
            tab.addEventListener('click', () => {
                document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                selectedDate = date;
                renderTasks(allTasks, allMaterials);
            });
            tabsContainer.appendChild(tab);
        });

        if (uniqueDates.length > 0) {
            tabsContainer.firstElementChild.classList.add('active');
            selectedDate = uniqueDates[0];
        }

        renderTagFilters(allTasks);
        renderTasks(allTasks, allMaterials);
    })
    .catch((error) => {
        taskList.innerHTML = `<li>Помилка завантаження даних: ${error.message}</li>`;
        console.error('Не вдалося завантажити дані', error);
    });
});