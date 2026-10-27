// Verificarea tokenului JWT si a rolului utilizatorului.
const jwt = require('jsonwebtoken');
const db = require('../db');

const SECRET = process.env.JWT_SECRET || 'eldercare-dev-secret';

function signToken(user) {
  return jwt.sign({ id: user.id, role: user.role }, SECRET, { expiresIn: '8h' });
}

function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Neautentificat' });
  try {
    const payload = jwt.verify(token, SECRET);
    const user = db.prepare('SELECT id, name, email, role, caregiver_id, blocked FROM users WHERE id = ?').get(payload.id);
    if (!user || user.blocked) return res.status(401).json({ error: 'Cont inexistent sau blocat' });
    req.user = user;
    next();
  } catch {
    return res.status(401).json({ error: 'Token invalid' });
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) return res.status(403).json({ error: 'Acces interzis' });
    next();
  };
}

// Verifica daca varstnicul :elderId apartine aparținatorului autentificat (NF2)
function loadOwnElder(req, res, next) {
  const elderId = Number(req.params.elderId);
  const elder = db.prepare("SELECT id, name, email, caregiver_id FROM users WHERE id = ? AND role = 'elder'").get(elderId);
  if (!elder) return res.status(404).json({ error: 'Varstnicul nu exista' });
  if (req.user.role !== 'admin' && elder.caregiver_id !== req.user.id) {
    return res.status(403).json({ error: 'Acces interzis' });
  }
  req.elder = elder;
  next();
}

module.exports = { signToken, requireAuth, requireRole, loadOwnElder };
