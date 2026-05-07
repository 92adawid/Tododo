// Hanterar kalendervisningen med månadsvy, navigation och svenska helgdagar.
// Lyssnar på "todosChanged" och ritar om kalendern när todos förändras.

import { getTodoCountByDate } from './todos.js';

// Svenska månadsnamn
const MONTHS = [
  'Januari','Februari','Mars','April','Maj','Juni',
  'Juli','Augusti','September','Oktober','November','December',
];

// Fasta helgdagar som alltid infaller samma datum varje år
const FIXED_HOLIDAYS = {
  '01-01': 'Nyårsdagen',
  '01-06': 'Trettondedag jul',
  '05-01': 'Valborg / Första maj',
  '06-06': 'Sveriges nationaldag',
  '12-24': 'Julafton',
  '12-25': 'Juldagen',
  '12-26': 'Annandag jul',
  '12-31': 'Nyårsafton',
};

// Räknar ut påskdagen för ett givet år med Gauss algoritm
function easterSunday(year) {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31); // månad som 1-baserat tal
  const day   = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
}

// Lägger till ett antal dagar på ett datum och returnerar det nya datumet
function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

// Omvandlar ett Date-objekt till en sträng i formatet YYYY-MM-DD
function toKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// Bygger ett objekt med alla svenska helgdagar för ett givet år
function getHolidaysForYear(year) {
  const map = {};

  // Fasta helgdagar
  Object.entries(FIXED_HOLIDAYS).forEach(([md, name]) => {
    map[`${year}-${md}`] = name;
  });

  // Rörliga helgdagar baserade på påskdagen
  const easter = easterSunday(year);
  const easterBased = {
    [-3]: 'Skärtorsdagen',
    [-2]: 'Långfredagen',
    [-1]: 'Påskafton',
      0 : 'Påskdagen',
      1 : 'Annandag påsk',
     39 : 'Kristi himmelsfärdsdag',
     49 : 'Pingstdagen',
  };
  Object.entries(easterBased).forEach(([offset, name]) => {
    map[toKey(addDays(easter, parseInt(offset)))] = name;
  });

  // Midsommar: midsommarafton är fredagen mellan 19 och 25 juni
  let midsommarEve = new Date(year, 5, 19); // börja på 19 juni
  while (midsommarEve.getDay() !== 5) midsommarEve = addDays(midsommarEve, 1);
  map[toKey(midsommarEve)]           = 'Midsommarafton';
  map[toKey(addDays(midsommarEve,1))]= 'Midsommardagen';

  // Alla helgons dag: lördagen mellan 31 oktober och 6 november
  let allSaints = new Date(year, 9, 31); // börja på 31 oktober
  while (allSaints.getDay() !== 6) allSaints = addDays(allSaints, 1);
  map[toKey(allSaints)] = 'Alla helgons dag';

  return map;
}

// Vilken månad och vilket år som visas just nu i kalendern
let viewYear;
let viewMonth; // 0-baserat, alltså 0 = januari

// Ritar upp kalendern för den aktuella månaden
function renderCalendar() {
  const grid      = document.getElementById('cal-grid');
  const titleEl   = document.getElementById('cal-month-title');
  const template  = document.getElementById('cal-day-template');

  if (!grid) return;
  grid.innerHTML = '';

  titleEl.textContent = `${MONTHS[viewMonth]} ${viewYear}`;

  const todoCounts = getTodoCountByDate();
  const holidays   = getHolidaysForYear(viewYear);

  const todayKey  = toKey(new Date());

  // Ta reda på vilken veckodag månaden börjar på och räkna om till måndag-baserad ordning
  const firstDay = new Date(viewYear, viewMonth, 1);
  let startDow = firstDay.getDay(); // 0 = söndag
  startDow = (startDow === 0) ? 6 : startDow - 1; // gör om så att 0 = måndag

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  // Fyll på tomma celler i början om månaden inte börjar på måndag
  for (let i = 0; i < startDow; i++) {
    const empty = document.createElement('div');
    empty.className = 'cal-day cal-day--empty';
    grid.appendChild(empty);
  }

  // Skapa en cell för varje dag i månaden
  for (let day = 1; day <= daysInMonth; day++) {
    const dateKey = `${viewYear}-${String(viewMonth+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;

    const clone   = template.content.cloneNode(true);
    const cell    = clone.querySelector('.cal-day');

    cell.dataset.date = dateKey;

    // Day number
    cell.querySelector('.cal-day-num').textContent = day;

    // Markera dagens datum
    if (dateKey === todayKey)    cell.classList.add('cal-day--today');

    const holiday = holidays[dateKey];
    if (holiday) {
      cell.classList.add('cal-day--holiday');
      const hn = cell.querySelector('.cal-holiday-name');
      hn.textContent  = holiday;
      hn.title        = holiday;
    }

    const count = todoCounts[dateKey];
    if (count) {
      cell.classList.add('cal-day--has-todos');
      const badge = cell.querySelector('.cal-todo-count');
      badge.textContent = count;
      badge.title = `${count} todo${count > 1 ? 's' : ''}`;
    }

    grid.appendChild(clone);
  }
}

// Startar kalendern och sätter upp knappar för att bläddra mellan månader
export function initCalendar() {
  const now  = new Date();
  viewYear   = now.getFullYear();
  viewMonth  = now.getMonth();

  renderCalendar();

  document.getElementById('cal-prev').addEventListener('click', () => {
    viewMonth--;
    if (viewMonth < 0) { viewMonth = 11; viewYear--; }
    renderCalendar();
  });

  document.getElementById('cal-next').addEventListener('click', () => {
    viewMonth++;
    if (viewMonth > 11) { viewMonth = 0; viewYear++; }
    renderCalendar();
  });

  // Rita om kalendern varje gång todos ändras
  document.addEventListener('todosChanged', renderCalendar);
}
