// UC7 – Administrare conturi
const router = require('express').Router();
const db = require('../db');
const { requireAuth, requireRole } = require('../middleware/auth');

router.use(requireAuth, requireRole('admin'));

router.get('/users', (req, res) => {
  const q = `%${req.query.q || ''}%`;
  res.json(db.prepare(`
    SELECT id, name, email, role, blocked, created_at FROM users
    WHERE (name LIKE ? OR email LIKE ?) ORDER BY created_at DESC
  `).all(q, q));
});

router.post('/users/:id/block', (req, res) => {
  const id = Number(req.params.id);
  if (id === req.user.id) return res.status(400).json({ error: 'Nu iti poti bloca propriul cont' });
  const blocked = req.body && req.body.blocked === false ? 0 : 1;
  const r = db.prepare('UPDATE users SET blocked = ? WHERE id = ?').run(blocked, id);
  if (r.changes === 0) return res.status(404).json({ error: 'Utilizatorul nu exista' });
  res.json({ id, blocked: !!blocked });
});

router.delete('/users/:id', (req, res) => {
  const id = Number(req.params.id);
  if (id === req.user.id) return res.status(400).json({ error: 'Nu iti poti sterge propriul cont' });
  const r = db.prepare('DELETE FROM users WHERE id = ?').run(id);
  if (r.changes === 0) return res.status(404).json({ error: 'Utilizatorul nu exista' });
  res.status(204).end();
});

router.get('/stats', (req, res) => {
  const count = (sql) => db.prepare(sql).get().n;
  res.json({
    caregivers: count("SELECT COUNT(*) n FROM users WHERE role = 'caregiver'"),
    elders: count("SELECT COUNT(*) n FROM users WHERE role = 'elder'"),
    medications: count('SELECT COUNT(*) n FROM medications'),
    dosesTaken: count("SELECT COUNT(*) n FROM doses WHERE status = 'taken'"),
    dosesMissed: count("SELECT COUNT(*) n FROM doses WHERE status = 'missed'"),
    sosAlerts: count("SELECT COUNT(*) n FROM alerts WHERE type = 'sos'"),
  });
});

module.exports = router;
