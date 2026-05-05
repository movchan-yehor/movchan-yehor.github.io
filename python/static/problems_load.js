document.addEventListener('DOMContentLoaded', () => {
    const taskList = document.getElementById('taskList');
    const clearFiltersButton = document.getElementById('clearFilters');
    const jsonUrl = './python/data/problems.json';
    let allTasks = [];
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

                if (ex.explanation) {
                    const explanationLine = document.createElement('p');
                    explanationLine.className = 'example-explanation';
                    explanationLine.innerHTML = `<strong>Пояснення:</strong> ${ex.explanation}`;
                    exBlock.appendChild(explanationLine);
                }

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

    function renderTasks(tasks) {

        if (selectedDate) {
            filteredTasks = tasks.filter(task => task.date === selectedDate);
        }

        const sortedTasks = sortByDifficulty(filteredTasks);

        taskList.innerHTML = '';

        if (sortedTasks.length === 0) {
            taskList.innerHTML = '<li>Завдання не знайдені за обраними тегами</li>';
            return;
        }

        sortedTasks.forEach((task, idx) => {
            const taskItem = createTaskItem(task, idx);
            taskList.appendChild(taskItem);
        });
    }

    fetch(jsonUrl)
        .then((response) => {
            if (!response.ok) {
                throw new Error(`HTTP error ${response.status}`);
            }
            return response.json();
        })
        .then((tasks) => {
            if (!Array.isArray(tasks) || tasks.length === 0) {
                taskList.innerHTML = '<li>Завдання не знайдені</li>';
                return;
            }

            allTasks = tasks;
            const uniqueDates = [...new Set(allTasks.map(task => task.date))].sort();
            const tabsContainer = document.getElementById('dateTabs');
            tabsContainer.innerHTML = '';

            uniqueDates.forEach(date => {
                const tab = document.createElement('button');
                tab.className = 'tab';
                tab.textContent = date;
                tab.addEventListener('click', () => {
                    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
                    tab.classList.add('active');
                    selectedDate = date;
                    renderTasks(allTasks);
                });
                tabsContainer.appendChild(tab);
            });

            if (uniqueDates.length > 0) {
                tabsContainer.firstElementChild.classList.add('active');
                selectedDate = uniqueDates[0];
            }

            renderTasks(allTasks);
        })
        .catch((error) => {
            taskList.innerHTML = `<li>Помилка завантаження задач: ${error.message}</li>`;
            console.error('Не вдалося завантажити problems.json', error);
        });
});