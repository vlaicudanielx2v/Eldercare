// Panoul aparținatorului: lista varstnicilor, alerte (UC5/UC6), medicamente (UC2), istoric (UC4)
import { useCallback, useEffect, useState } from 'react';
import { api } from '../api.js';
import ElderDetails from './ElderDetails.jsx';

export default function CaregiverDashboard() {
  const [elders, setElders] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({ name: '', email: '', pin: '' });
  const [showAdd, setShowAdd] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const [e, a] = await Promise.all([api('/caregiver/elders'), api('/caregiver/alerts')]);
      setElders(e);
      setAlerts(a);
    } catch (err) {
      setError(err.message);
    }
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 30 * 1000); // verificare periodica a alertelor
    return () => clearInterval(t);
  }, [load]);

  async function addElder(e) {
    e.preventDefault();
    setError('');
    try {
      await api('/caregiver/elders', { method: 'POST', body: form });
      setForm({ name: '', email: '', pin: '' });
      setShowAdd(false);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function markRead(id) {
    await api(`/caregiver/alerts/${id}/read`, { method: 'POST' });
    load();
  }

  if (selected) {
    return <ElderDetails elder={selected} onBack={() => { setSelected(null); load(); }} />;
  }

  const unread = alerts.filter((a) => !a.is_read);

  return (
    <div className="dashboard">
      <h1>Panoul meu</h1>
      {error && <p className="error">{error}</p>}

      {unread.length > 0 && (
        <section className="card alerts">
          <h2>Alerte noi ({unread.length})</h2>
          {unread.map((a) => (
            <div key={a.id} className={`alert ${a.type}`}>
              <div>
                <strong>{a.type === 'sos' ? 'SOS' : 'Doză ratată'}</strong> – {a.message}
                <div className="muted small">{a.created_at.replace('T', ' ')}</div>
              </div>
              <button className="btn-secondary" onClick={() => markRead(a.id)}>Am văzut</button>
            </div>
          ))}
        </section>
      )}

      <section className="card">
        <div className="row-between">
          <h2>Persoanele de care am grijă</h2>
          <button className="btn-primary" onClick={() => setShowAdd((v) => !v)}>
            {showAdd ? 'Închide' : '+ Adaugă vârstnic'}
          </button>
        </div>

        {showAdd && (
          <form className="form inline" onSubmit={addElder}>
            <label>Nume<input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></label>
            <label>E-mail (pentru login)<input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required /></label>
            <label>PIN (4 cifre)<input value={form.pin} maxLength={4} pattern="\d{4}" onChange={(e) => setForm({ ...form, pin: e.target.value })} required /></label>
            <button className="btn-primary">Salvează</button>
          </form>
        )}

        {elders.length === 0 ? (
          <p className="muted">Nu ai adăugat încă nicio persoană.</p>
        ) : (
          <ul className="elder-list">
            {elders.map((e) => (
              <li key={e.id}>
                <button className="elder-item" onClick={() => setSelected(e)}>
                  <span><strong>{e.name}</strong><br /><small className="muted">{e.email}</small></span>
                  {e.unread_alerts > 0 && <span className="badge">{e.unread_alerts}</span>}
                  <span className="chev">›</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
