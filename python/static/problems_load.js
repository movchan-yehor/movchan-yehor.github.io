document.addEventListener('DOMContentLoaded', () => {
    const taskList = document.getElementById('taskList');
    const jsonUrl = 'https://movchan-yehor.github.io/python/data/problems.json';
    
    function createTaskItem(task, index) {
        const li = document.createElement('li');
        li.className = 'task-item';

        const header = document.createElement('div');
        header.className = 'task-header';

        const title = document.createElement('span');
        title.textContent = `${index + 1}. ${task.name}`;

        const complexity = document.createElement('span');
        complexity.className = 'complexity';
        complexity.textContent = task.difficulty || 'Невідомо';

        header.appendChild(title);
        header.appendChild(complexity);

        const description = document.createElement('p');
        description.textContent = task.description || 'Опис відсутній.';

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

            taskList.innerHTML = '';
            tasks.forEach((task, idx) => {
                const taskItem = createTaskItem(task, idx);
                taskList.appendChild(taskItem);
            });
        })
        .catch((error) => {
            taskList.innerHTML = `<li>Помилка завантаження задач: ${error.message}</li>`;
            console.error('Не вдалося завантажити problems.json', error);
        });
});