// UC7 – Panoul administratorului: statistici si gestionarea conturilor
import { useCallback, useEffect, useState } from 'react';
import { api } from '../api.js';

const ROLE = { elder: 'Vârstnic', caregiver: 'Aparținător', admin: 'Administrator' };

export default function AdminPanel() {
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [q, setQ] = useState('');
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const [u, s] = await Promise.all([api(`/admin/users?q=${encodeURIComponent(q)}`), api('/admin/stats')]);
      setUsers(u);
      setStats(s);
    } catch (err) {
      setError(err.message);
    }
  }, [q]);

  useEffect(() => { load(); }, [load]);

  async function toggleBlock(u) {
    try {
      await api(`/admin/users/${u.id}/block`, { method: 'POST', body: { blocked: !u.blocked } });
      load();
    } catch (err) { setError(err.message); }
  }

  async function remove(u) {
    if (!window.confirm(`Ștergi contul ${u.email}?`)) return;
    try {
      await api(`/admin/users/${u.id}`, { method: 'DELETE' });
      load();
    } catch (err) { setError(err.message); }
  }

  return (
    <div className="dashboard">
      <h1>Administrare</h1>
      {error && <p className="error">{error}</p>}

      {stats && (
        <div className="stats wide">
          <div className="stat"><span className="stat-value">{stats.caregivers}</span><span>aparținători</span></div>
          <div className="stat"><span className="stat-value">{stats.elders}</span><span>vârstnici</span></div>
          <div className="stat"><span className="stat-value">{stats.medications}</span><span>medicamente</span></div>
          <div className="stat"><span className="stat-value ok">{stats.dosesTaken}</span><span>doze luate</span></div>
          <div className="stat"><span className="stat-value bad">{stats.dosesMissed}</span><span>doze ratate</span></div>
          <div className="stat"><span className="stat-value bad">{stats.sosAlerts}</span><span>alerte SOS</span></div>
        </div>
      )}

      <section className="card">
        <div className="row-between">
          <h2>Utilizatori</h2>
          <input className="search" placeholder="Caută după nume sau e-mail" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <table className="table">
          <thead><tr><th>Nume</th><th>E-mail</th><th>Rol</th><th>Stare</th><th></th></tr></thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td>{u.name}</td>
                <td>{u.email}</td>
                <td>{ROLE[u.role]}</td>
                <td>{u.blocked ? <span className="pill missed">Blocat</span> : <span className="pill taken">Activ</span>}</td>
                <td className="actions">
                  {u.role !== 'admin' && (
                    <>
                      <button className="btn-link" onClick={() => toggleBlock(u)}>{u.blocked ? 'Deblochează' : 'Blochează'}</button>
                      <button className="btn-link danger" onClick={() => remove(u)}>Șterge</button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
