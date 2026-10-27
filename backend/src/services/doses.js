// Logica pentru doze: generarea dozelor zilnice si detectarea dozelor ratate.
const db = require('../db');
const time = require('../utils/time');

const MISSED_AFTER_MINUTES = Number(process.env.MISSED_AFTER_MINUTES || 30);

// Creeaza (daca nu exista) dozele programate pentru ziua data, pentru toate medicamentele active.
function generateDosesFor(day = time.today(), elderId = null) {
  const meds = elderId
    ? db.prepare('SELECT * FROM medications WHERE elder_id = ?').all(elderId)
    : db.prepare('SELECT * FROM medications').all();
  const insert = db.prepare(
    'INSERT OR IGNORE INTO doses (medication_id, elder_id, scheduled_at) VALUES (?, ?, ?)'
  );
  for (const m of meds) {
    if (m.start_date > day) continue;
    if (m.end_date && m.end_date < day) continue;
    for (const t of m.times.split(',').map((s) => s.trim()).filter(Boolean)) {
      insert.run(m.id, m.elder_id, `${day}T${t}`);
    }
  }
}

// Marcheaza ca "ratate" dozele neconfirmate de peste MISSED_AFTER_MINUTES si creeaza alerte (UC5).
function checkMissedDoses(minutes = MISSED_AFTER_MINUTES) {
  const limit = time.minutesAgo(minutes);
  const late = db.prepare(`
    SELECT d.id, d.elder_id, d.scheduled_at, m.name AS med_name, u.name AS elder_name, u.caregiver_id
    FROM doses d
    JOIN medications m ON m.id = d.medication_id
    JOIN users u ON u.id = d.elder_id
    WHERE d.status = 'pending' AND d.scheduled_at <= ?
  `).all(limit);

  const markMissed = db.prepare("UPDATE doses SET status = 'missed' WHERE id = ?");
  const addAlert = db.prepare(
    "INSERT INTO alerts (elder_id, caregiver_id, type, message, created_at) VALUES (?, ?, 'missed', ?, ?)"
  );
  const tx = db.transaction(() => {
    for (const d of late) {
      markMissed.run(d.id);
      if (d.caregiver_id) {
        addAlert.run(
          d.elder_id, d.caregiver_id,
          `${d.elder_name} nu a confirmat doza de ${d.med_name} programata la ${d.scheduled_at.slice(11)}.`,
          time.stamp()
        );
      }
    }
  });
  tx();
  return late.length;
}

// Statistica de aderenta: procentul dozelor luate din totalul dozelor incheiate (luate + ratate).
function adherence(elderId, days) {
  const from = `${time.daysAgo(days - 1)}T00:00`;
  const rows = db.prepare(`
    SELECT d.id, d.scheduled_at, d.status, d.taken_at, m.name AS med_name, m.dose
    FROM doses d JOIN medications m ON m.id = d.medication_id
    WHERE d.elder_id = ? AND d.scheduled_at >= ? AND d.scheduled_at <= ?
    ORDER BY d.scheduled_at DESC
  `).all(elderId, from, time.stamp());
  const taken = rows.filter((r) => r.status === 'taken').length;
  const missed = rows.filter((r) => r.status === 'missed').length;
  const total = taken + missed;
  return {
    doses: rows,
    taken,
    missed,
    adherence: total === 0 ? null : Math.round((taken / total) * 100),
  };
}

module.exports = { generateDosesFor, checkMissedDoses, adherence, MISSED_AFTER_MINUTES };
