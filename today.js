// Hanterar välkomstsegmentet högst upp till vänster.
// Visar en liveklocka, dagens veckodag och datum, samt en hälsning baserad på tid på dygnet.

const WEEKDAYS = ['Söndag', 'Måndag', 'Tisdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lördag'];
const MONTHS   = ['januari','februari','mars','april','maj','juni',
                  'juli','augusti','september','oktober','november','december'];

// Väljer hälsning beroende på vad klockan är
function getGreeting(hour) {
  if (hour < 5)  return 'God natt! 🌙';
  if (hour < 10) return 'God morgon! ☀️';
  if (hour < 12) return 'God förmiddag! 🌤️';
  if (hour < 17) return 'God eftermiddag! 🌞';
  if (hour < 21) return 'God kväll! 🌆';
  return 'God natt! 🌙';
}

// Ser till att enkelsiffriga tal alltid visas med en nolla framför
function pad(n) {
  return String(n).padStart(2, '0');
}

// Körs varje sekund och uppdaterar klocka, datum och hälsning
function tick() {
  const now = new Date();

  // Uppdatera klockan
  const clockEl = document.getElementById('today-clock');
  if (clockEl) {
    clockEl.textContent = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
  }

  // Uppdatera veckodagen
  const weekdayEl = document.getElementById('today-weekday');
  if (weekdayEl) {
    weekdayEl.textContent = WEEKDAYS[now.getDay()];
  }

  // Uppdatera datumet
  const dateEl = document.getElementById('today-date');
  if (dateEl) {
    dateEl.textContent = `${now.getDate()} ${MONTHS[now.getMonth()]} ${now.getFullYear()}`;
  }

  // Uppdatera hälsningen
  const greetingEl = document.getElementById('today-greeting');
  if (greetingEl) {
    greetingEl.textContent = getGreeting(now.getHours());
  }
}

export function initToday() {
  tick();
  setInterval(tick, 1000);
}
