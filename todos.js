// Hanterar todos: lägga till, ta bort, markera som klara och filtrera.
// Todos sparas i localStorage så de finns kvar när sidan laddas om.
// Skickar ett eget event "todosChanged" när listan ändras så att kalendern kan uppdatera sig.

const STORAGE_KEY = 'tododo_todos';

const MONTHS = ['jan','feb','mar','apr','maj','jun',
                'jul','aug','sep','okt','nov','dec'];

// Todos och vilket filter som är aktivt just nu
let todos  = [];
let filter = 'all'; // 'all' | 'today' | 'upcoming'

// Ladda in sparade todos från localStorage
function load() {
  try {
    todos = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    todos = [];
  }
}

// Spara todos och meddela kalendern att något har ändrats
function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
  document.dispatchEvent(new CustomEvent('todosChanged'));
}

// Returnerar dagens datum som en sträng i formatet YYYY-MM-DD
function todayString() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

// Gör om ett datum och eventuell tid till ett läsbart format på svenska
function formatDate(dateStr, timeStr) {
  const [y, m, d] = dateStr.split('-');
  const base = `${parseInt(d)} ${MONTHS[parseInt(m)-1]} ${y}`;
  return timeStr ? `${base} kl. ${timeStr}` : base;
}

// Filtrerar listan beroende på vilket filter användaren har valt
function getFiltered() {
  const today = todayString();
  if (filter === 'today')    return todos.filter(t => t.date === today);
  if (filter === 'upcoming') return todos.filter(t => t.date > today);
  return todos;
}

// Returnerar ett objekt med datum som nyckel och antal todos som värde.
// Används av kalendern för att visa hur många todos som finns per dag.
export function getTodoCountByDate() {
  const map = {};
  todos.forEach(t => {
    map[t.date] = (map[t.date] || 0) + 1;
  });
  return map;
}

// Ritar upp todo-listan på sidan
function renderTodos() {
  const list     = document.getElementById('todo-list');
  const emptyMsg = document.getElementById('todo-empty');
  const template = document.getElementById('todo-template');

  list.innerHTML = '';

  const visible = getFiltered();

  if (visible.length === 0) {
    emptyMsg.style.display = 'block';
    return;
  }
  emptyMsg.style.display = 'none';

  // Sortera på datum och sedan klockslag, todos utan tid hamnar sist på dagen
  const sorted = [...visible].sort((a, b) => {
    const da = a.date + (a.time ? `T${a.time}` : 'T23:59');
    const db = b.date + (b.time ? `T${b.time}` : 'T23:59');
    return da.localeCompare(db);
  });

  sorted.forEach(todo => {
    const clone = template.content.cloneNode(true);
    const li    = clone.querySelector('.todo-item');

    li.dataset.id = todo.id;
    if (todo.done) li.classList.add('done');

    const textEl = li.querySelector('.todo-text');
    textEl.textContent = todo.text;

    const metaEl = li.querySelector('.todo-meta-date');
    metaEl.textContent = formatDate(todo.date, todo.time);

    const checkbox = li.querySelector('.todo-check');
    checkbox.checked = todo.done;
    checkbox.addEventListener('change', () => toggleDone(todo.id));

    const deleteBtn = li.querySelector('.btn-delete');
    deleteBtn.addEventListener('click', () => deleteTodo(todo.id));

    list.appendChild(clone);
  });
}

// Lägger till en ny todo i listan
function addTodo(text, date, time) {
  todos.push({
    id:   crypto.randomUUID(),
    text: text.trim(),
    date,
    time: time || '',
    done: false,
  });
  save();
  renderTodos();
}

// Tar bort en todo baserat på dess id
function deleteTodo(id) {
  todos = todos.filter(t => t.id !== id);
  save();
  renderTodos();
}

// Växlar en todo mellan klar och inte klar
function toggleDone(id) {
  const todo = todos.find(t => t.id === id);
  if (todo) {
    todo.done = !todo.done;
    save();
    renderTodos();
  }
}

// Byter aktivt filter och ritar om listan
function setFilter(newFilter) {
  filter = newFilter;
  renderTodos();
}

export function initTodos() {
  load();
  renderTodos();

  const form      = document.getElementById('add-todo-form');
  const inputText = document.getElementById('todo-input');
  const inputDate = document.getElementById('todo-date');
  const inputTime = document.getElementById('todo-time');

  // Sätt dagens datum som förvalt i datumfältet
  inputDate.value = todayString();

  form.addEventListener('submit', e => {
    e.preventDefault();
    const text = inputText.value.trim();
    const date = inputDate.value;
    const time = inputTime.value;
    if (!text || !date) return;
    addTodo(text, date, time);
    inputText.value = '';
    inputDate.value = todayString();
    inputTime.value = '';
    inputText.focus();
  });

  // Lyssna på filterknapparna och byt filter när man klickar
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      setFilter(btn.dataset.filter);
    });
  });
}
