// Startpunkt för programmet. Startar alla delar i rätt ordning.

import { initToday }    from './today.js';
import { initTodos }    from './todos.js';
import { initCalendar } from './calendar.js';

initToday();
initTodos();
initCalendar();
