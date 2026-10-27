// Rute pentru varstnic: dozele zilei (F4), confirmare doza (UC3), SOS (UC6)
const router = require('express').Router();
const db = require('../db');
const time = require('../utils/time');
const { requireAuth, requireRole } = require('../middleware/auth');
const { generateDosesFor, checkMissedDoses } = require('../services/doses');

router.use(requireAuth, requireRole('elder'));

router.get('/today', (req, res) => {
  generateDosesFor(time.today(), req.user.id);
  checkMissedDoses();
  const doses = db.prepare(`
    SELECT d.id, d.scheduled_at, d.status, d.taken_at, m.name AS med_name, m.dose
    FROM doses d JOIN medications m ON m.id = d.medication_id
    WHERE d.elder_id = ? AND d.scheduled_at LIKE ?
    ORDER BY d.scheduled_at
  `).all(req.user.id, `${time.today()}%`);
  const now = time.stamp();
  // "due" = doza a carei ora a sosit si inca nu a fost confirmata
  res.json(doses.map((d) => ({ ...d, due: d.status === 'pending' && d.scheduled_at <= now })));
});

router.post('/doses/:id/take', (req, res) => {
  const dose = db.prepare('SELECT * FROM doses WHERE id = ? AND elder_id = ?').get(Number(req.params.id), req.user.id);
  if (!dose) return res.status(404).json({ error: 'Doza nu exista' });
  if (dose.status === 'taken') return res.status(409).json({ error: 'Doza a fost deja confirmata' });
  if (dose.status === 'missed') return res.status(409).json({ error: 'Doza a fost marcata ca ratata' });
  const now = time.stamp();
  db.prepare("UPDATE doses SET status = 'taken', taken_at = ? WHERE id = ?").run(now, dose.id);
  res.json({ ...dose, status: 'taken', taken_at: now });
});

router.post('/sos', (req, res) => {
  if (!req.user.caregiver_id) return res.status(400).json({ error: 'Nu exista un aparținator asociat' });
  const created = time.stamp();
  const info = db.prepare(
    "INSERT INTO alerts (elder_id, caregiver_id, type, message, created_at) VALUES (?, ?, 'sos', ?, ?)"
  ).run(req.user.id, req.user.caregiver_id, `SOS! ${req.user.name} cere ajutor.`, created);
  res.status(201).json({ id: info.lastInsertRowid, message: 'Familia a fost anuntata' });
});

module.exports = router;
