// UC2 – medicamente (adaugare, modificare, stergere) si UC4 – istoric si aderenta
import { useCallback, useEffect, useState } from 'react';
import { api } from '../api.js';

const EMPTY = { name: '', dose: '', times: '08:00', start_date: '', end_date: '' };
const STATUS = { taken: 'Luată', missed: 'Ratată', pending: 'În așteptare' };

export default function ElderDetails({ elder, onBack }) {
  const [meds, setMeds] = useState([]);
  const [history, setHistory] = useState(null);
  const [days, setDays] = useState(7);
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const [m, h] = await Promise.all([
        api(`/caregiver/elders/${elder.id}/medications`),
        api(`/caregiver/elders/${elder.id}/history?days=${days}`),
      ]);
      setMeds(m);
      setHistory(h);
    } catch (err) {
      setError(err.message);
    }
  }, [elder.id, days]);

  useEffect(() => { load(); }, [load]);

  async function save(e) {
    e.preventDefault();
    setError('');
    const body = {
      ...form,
      times: form.times.split(',').map((t) => t.trim()).filter(Boolean),
      start_date: form.start_date || undefined,
      end_date: form.end_date || null,
    };
    try {
      if (editingId) await api(`/caregiver/medications/${editingId}`, { method: 'PUT', body });
      else await api(`/caregiver/elders/${elder.id}/medications`, { method: 'POST', body });
      setForm(EMPTY);
      setEditingId(null);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  function edit(m) {
    setEditingId(m.id);
    setForm({ name: m.name, dose: m.dose, times: m.times, start_date: m.start_date, end_date: m.end_date || '' });
  }

  async function remove(m) {
    if (!window.confirm(`Ștergi medicamentul ${m.name}?`)) return;
    await api(`/caregiver/medications/${m.id}`, { method: 'DELETE' });
    load();
  }

  return (
    <div className="dashboard">
      <button className="btn-link" onClick={onBack}>‹ Înapoi</button>
      <h1>{elder.name}</h1>
      {error && <p className="error">{error}</p>}

      <section className="card">
        <h2>Medicamente</h2>
        {meds.length === 0 && <p className="muted">Niciun medicament adăugat.</p>}
        <table className="table">
          {meds.length > 0 && (
            <thead><tr><th>Denumire</th><th>Doză</th><th>Ore</th><th>Perioadă</th><th></th></tr></thead>
          )}
          <tbody>
            {meds.map((m) => (
              <tr key={m.id}>
                <td>{m.name}</td>
                <td>{m.dose}</td>
                <td>{m.times.replaceAll(',', ', ')}</td>
                <td>{m.start_date}{m.end_date ? ` → ${m.end_date}` : ' → nelimitat'}</td>
                <td className="actions">
                  <button className="btn-link" onClick={() => edit(m)}>Modifică</button>
                  <button className="btn-link danger" onClick={() => remove(m)}>Șterge</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <h3>{editingId ? 'Modifică medicamentul' : 'Adaugă medicament'}</h3>
        <form className="form grid" onSubmit={save}>
          <label>Denumire<input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>
          <label>Doză<input value={form.dose} placeholder="ex: 500 mg" onChange={(e) => setForm({ ...form, dose: e.target.value })} /></label>
          <label>Ore (separate prin virgulă)<input value={form.times} placeholder="08:00, 20:00" onChange={(e) => setForm({ ...form, times: e.target.value })} /></label>
          <label>De la<input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} /></label>
          <label>Până la (opțional)<input type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} /></label>
          <div className="form-actions">
            <button className="btn-primary">{editingId ? 'Salvează modificările' : 'Salvează'}</button>
            {editingId && <button type="button" className="btn-secondary" onClick={() => { setEditingId(null); setForm(EMPTY); }}>Renunță</button>}
          </div>
        </form>
      </section>

      <section className="card">
        <div className="row-between">
          <h2>Istoric</h2>
          <div className="tabs">
            {[7, 30].map((d) => (
              <button key={d} className={days === d ? 'tab active' : 'tab'} onClick={() => setDays(d)}>{d} zile</button>
            ))}
          </div>
        </div>
        {history && (
          <>
            <div className="stats">
              <div className="stat"><span className="stat-value">{history.adherence ?? '–'}{history.adherence != null && '%'}</span><span>aderență</span></div>
              <div className="stat"><span className="stat-value ok">{history.taken}</span><span>doze luate</span></div>
              <div className="stat"><span className="stat-value bad">{history.missed}</span><span>doze ratate</span></div>
            </div>
            {history.adherence != null && (
              <div className="bar" aria-label={`Aderență ${history.adherence}%`}>
                <div className="bar-fill" style={{ width: `${history.adherence}%` }} />
              </div>
            )}
            <table className="table">
              <thead><tr><th>Data și ora</th><th>Medicament</th><th>Stare</th></tr></thead>
              <tbody>
                {history.doses.map((d) => (
                  <tr key={d.id}>
                    <td>{d.scheduled_at.replace('T', ' ')}</td>
                    <td>{d.med_name} <small className="muted">{d.dose}</small></td>
                    <td><span className={`pill ${d.status}`}>{STATUS[d.status]}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </section>
    </div>
  );
}
