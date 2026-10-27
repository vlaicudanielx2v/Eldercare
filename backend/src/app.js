// Configurarea aplicatiei Express (exportata separat pentru teste)
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/caregiver', require('./routes/caregiver'));
app.use('/api/elder', require('./routes/elder'));
app.use('/api/admin', require('./routes/admin'));

app.use((req, res) => res.status(404).json({ error: 'Ruta inexistenta' }));
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Eroare interna de server' });
});

module.exports = app;
