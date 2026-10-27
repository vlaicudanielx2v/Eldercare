// UC1 – Autentificare si inregistrare
const router = require('express').Router();
const bcrypt = require('bcryptjs');
const db = require('../db');
const time = require('../utils/time');
const { signToken, requireAuth } = require('../middleware/auth');

const MAX_ATTEMPTS = 5;
const LOCK_MINUTES = 15;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const publicUser = (u) => ({ id: u.id, name: u.name, email: u.email, role: u.role });

// Inregistrare aparținator
router.post('/register', (req, res) => {
  const { name, email, password } = req.body || {};
  if (!name || !email || !password) return res.status(400).json({ error: 'Toate campurile sunt obligatorii' });
  if (!EMAIL_RE.test(email)) return res.status(400).json({ error: 'E-mail invalid' });
  if (password.length < 6) return res.status(400).json({ error: 'Parola trebuie sa aiba minim 6 caractere' });
  if (db.prepare('SELECT id FROM users WHERE email = ?').get(email)) {
    return res.status(409).json({ error: 'Exista deja un cont cu acest e-mail' });
  }
  const info = db.prepare('INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)')
    .run(name, email, bcrypt.hashSync(password, 10), 'caregiver');
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(info.lastInsertRowid);
  res.status(201).json({ token: signToken(user), user: publicUser(user) });
});

// Login (aparținator/admin cu parola, varstnic cu PIN)
router.post('/login', (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'E-mail si parola obligatorii' });

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  const fail = () => res.status(401).json({ error: 'E-mail sau parola incorecte' });
  if (!user) return fail();

  if (user.blocked) return res.status(403).json({ error: 'Contul a fost blocat de administrator' });
  if (user.locked_until && user.locked_until > time.stamp()) {
    return res.status(423).json({ error: `Prea multe incercari gresite. Incearca dupa ora ${user.locked_until.slice(11)}.` });
  }

  if (!bcrypt.compareSync(password, user.password_hash)) {
    const attempts = user.failed_attempts + 1;
    if (attempts >= MAX_ATTEMPTS) {
      const until = time.stamp(new Date(Date.now() + LOCK_MINUTES * 60 * 1000));
      db.prepare('UPDATE users SET failed_attempts = 0, locked_until = ? WHERE id = ?').run(until, user.id);
      return res.status(423).json({ error: `Cont blocat ${LOCK_MINUTES} minute dupa ${MAX_ATTEMPTS} incercari gresite.` });
    }
    db.prepare('UPDATE users SET failed_attempts = ? WHERE id = ?').run(attempts, user.id);
    return fail();
  }

  db.prepare('UPDATE users SET failed_attempts = 0, locked_until = NULL WHERE id = ?').run(user.id);
  res.json({ token: signToken(user), user: publicUser(user) });
});

router.get('/me', requireAuth, (req, res) => res.json(publicUser(req.user)));

module.exports = router;
