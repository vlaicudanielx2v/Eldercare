// Rute pentru aparținator: varstnici (F2), medicamente (UC2), istoric (UC4), alerte (UC5/UC6)
const router = require('express').Router();
const bcrypt = require('bcryptjs');
const db = require('../db');
const time = require('../utils/time');
const { requireAuth, requireRole, loadOwnElder } = require('../middleware/auth');
const { generateDosesFor, adherence } = require('../services/doses');

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

router.use(requireAuth, requireRole('caregiver', 'admin'));

// ----- Varstnici -----
router.get('/elders', (req, res) => {
  const elders = db.prepare(`
    SELECT u.id, u.name, u.email,
      (SELECT COUNT(*) FROM alerts a WHERE a.elder_id = u.id AND a.is_read = 0) AS unread_alerts
    FROM users u WHERE u.role = 'elder' AND u.caregiver_id = ? ORDER BY u.name
  `).all(req.user.id);
  res.json(elders);
});

router.post('/elders', (req, res) => {
  const { name, email, pin } = req.body || {};
  if (!name || !email || !pin) return res.status(400).json({ error: 'Nume, e-mail si PIN obligatorii' });
  if (!/^\d{4}$/.test(pin)) return res.status(400).json({ error: 'PIN-ul trebuie sa aiba exact 4 cifre' });
  if (db.prepare('SELECT id FROM users WHERE email = ?').get(email)) {
    return res.status(409).json({ error: 'Exista deja un cont cu acest e-mail' });
  }
  const info = db.prepare(
    "INSERT INTO users (name, email, password_hash, role, caregiver_id) VALUES (?, ?, ?, 'elder', ?)"
  ).run(name, email, bcrypt.hashSync(pin, 10), req.user.id);
  res.status(201).json({ id: info.lastInsertRowid, name, email });
});

// ----- Medicamente (UC2) -----
function validateMed(body) {
  const { name, dose, times, start_date, end_date } = body || {};
  if (!name || !String(name).trim()) return 'Denumirea este obligatorie';
  if (!dose || !String(dose).trim()) return 'Doza este obligatorie';
  const list = Array.isArray(times) ? times : String(times || '').split(',');
  const clean = list.map((t) => String(t).trim()).filter(Boolean);
  if (clean.length === 0) return 'Adauga cel putin o ora';
  if (!clean.every((t) => TIME_RE.test(t))) return 'Orele trebuie sa fie in formatul HH:MM';
  if (start_date && !DATE_RE.test(start_date)) return 'Data de inceput invalida';
  if (end_date && !DATE_RE.test(end_date)) return 'Data de sfarsit invalida';
  if (end_date && start_date && end_date < start_date) return 'Data de sfarsit este inaintea datei de inceput';
  return null;
}
const normTimes = (times) =>
  (Array.isArray(times) ? times : String(times).split(',')).map((t) => String(t).trim()).filter(Boolean).sort().join(',');

router.get('/elders/:elderId/medications', loadOwnElder, (req, res) => {
  res.json(db.prepare('SELECT * FROM medications WHERE elder_id = ? ORDER BY name').all(req.elder.id));
});

router.post('/elders/:elderId/medications', loadOwnElder, (req, res) => {
  const err = validateMed(req.body);
  if (err) return res.status(400).json({ error: err });
  const { name, dose, times, start_date, end_date } = req.body;
  const info = db.prepare(
    'INSERT INTO medications (elder_id, name, dose, times, start_date, end_date) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(req.elder.id, name.trim(), dose.trim(), normTimes(times), start_date || time.today(), end_date || null);
  generateDosesFor(time.today(), req.elder.id);
  res.status(201).json(db.prepare('SELECT * FROM medications WHERE id = ?').get(info.lastInsertRowid));
});

function loadOwnMed(req, res, next) {
  const med = db.prepare('SELECT * FROM medications WHERE id = ?').get(Number(req.params.medId));
  if (!med) return res.status(404).json({ error: 'Medicamentul nu exista' });
  req.params.elderId = med.elder_id;
  req.med = med;
  loadOwnElder(req, res, next);
}

router.put('/medications/:medId', loadOwnMed, (req, res) => {
  const merged = { ...req.med, ...req.body };
  const err = validateMed(merged);
  if (err) return res.status(400).json({ error: err });
  db.prepare('UPDATE medications SET name = ?, dose = ?, times = ?, start_date = ?, end_date = ? WHERE id = ?')
    .run(merged.name.trim(), merged.dose.trim(), normTimes(merged.times), merged.start_date, merged.end_date || null, req.med.id);
  // dozele viitoare din ziua curenta se regenereaza conform noului program
  db.prepare("DELETE FROM doses WHERE medication_id = ? AND status = 'pending' AND scheduled_at > ?").run(req.med.id, time.stamp());
  generateDosesFor(time.today(), req.med.elder_id);
  res.json(db.prepare('SELECT * FROM medications WHERE id = ?').get(req.med.id));
});

router.delete('/medications/:medId', loadOwnMed, (req, res) => {
  db.prepare('DELETE FROM medications WHERE id = ?').run(req.med.id);
  res.status(204).end();
});

// ----- Istoric si aderenta (UC4) -----
router.get('/elders/:elderId/history', loadOwnElder, (req, res) => {
  const days = [7, 30].includes(Number(req.query.days)) ? Number(req.query.days) : 7;
  res.json({ elder: req.elder, days, ...adherence(req.elder.id, days) });
});

// ----- Alerte (UC5, UC6) -----
router.get('/alerts', (req, res) => {
  res.json(db.prepare(`
    SELECT a.*, u.name AS elder_name FROM alerts a JOIN users u ON u.id = a.elder_id
    WHERE a.caregiver_id = ? ORDER BY a.created_at DESC, a.id DESC LIMIT 50
  `).all(req.user.id));
});

router.post('/alerts/:id/read', (req, res) => {
  const r = db.prepare('UPDATE alerts SET is_read = 1 WHERE id = ? AND caregiver_id = ?').run(Number(req.params.id), req.user.id);
  if (r.changes === 0) return res.status(404).json({ error: 'Alerta nu exista' });
  res.json({ ok: true });
});

module.exports = router;
