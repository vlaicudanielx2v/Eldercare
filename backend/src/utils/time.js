// Functii ajutatoare pentru data/ora locala in format text.
const pad = (n) => String(n).padStart(2, '0');

// "YYYY-MM-DD"
function today(d = new Date()) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// "YYYY-MM-DDTHH:MM"
function stamp(d = new Date()) {
  return `${today(d)}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function minutesAgo(min) {
  return stamp(new Date(Date.now() - min * 60 * 1000));
}

function daysAgo(days) {
  return today(new Date(Date.now() - days * 24 * 60 * 60 * 1000));
}

module.exports = { today, stamp, minutesAgo, daysAgo };
