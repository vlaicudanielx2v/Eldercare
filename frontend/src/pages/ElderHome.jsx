// F4 / UC3 / UC6 – Ecranul varstnicului: dozele zilei, butonul „Am luat” si SOS
import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../api.js';

const STATUS = { taken: 'Luat ✓', missed: 'Ratat', pending: 'Urmează' };

function beep() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const o = ctx.createOscillator();
    o.frequency.value = 880;
    o.connect(ctx.destination);
    o.start();
    o.stop(ctx.currentTime + 0.4);
  } catch { /* sunetul nu este disponibil */ }
}

export default function ElderHome({ user }) {
  const [doses, setDoses] = useState([]);
  const [error, setError] = useState('');
  const [sosStep, setSosStep] = useState('idle'); // idle | confirm | sent
  const lastDue = useRef(0);

  const load = useCallback(async () => {
    try {
      const d = await api('/elder/today');
      setDoses(d);
      const dueCount = d.filter((x) => x.due).length;
      if (dueCount > lastDue.current) beep(); // reminder sonor
      lastDue.current = dueCount;
      setError('');
    } catch (e) {
      setError(e.message);
    }
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 30 * 1000);
    return () => clearInterval(t);
  }, [load]);

  async function take(id) {
    try {
      await api(`/elder/doses/${id}/take`, { method: 'POST' });
      load();
    } catch (e) {
      setError(e.message);
    }
  }

  async function sendSos() {
    try {
      await api('/elder/sos', { method: 'POST' });
      setSosStep('sent');
      setTimeout(() => setSosStep('idle'), 8000);
    } catch (e) {
      setError(e.message);
      setSosStep('idle');
    }
  }

  const due = doses.filter((d) => d.due);
  const rest = doses.filter((d) => !d.due);

  return (
    <div className="elder">
      <h1>Bună ziua, {user.name.split(' ')[0]}!</h1>
      {error && <p className="error">{error}</p>}

      {due.length > 0 ? (
        due.map((d) => (
          <div key={d.id} className="due-card" role="alert">
            <p className="due-time">Ora {d.scheduled_at.slice(11)}</p>
            <p className="due-med">{d.med_name}</p>
            <p className="due-dose">{d.dose}</p>
            <button className="btn-huge" onClick={() => take(d.id)}>Am luat</button>
          </div>
        ))
      ) : (
        <div className="calm-card">Nu aveți niciun medicament de luat acum.</div>
      )}

      <h2>Medicamentele de azi</h2>
      {rest.length === 0 && due.length === 0 && <p className="muted">Nu există medicamente programate azi.</p>}
      <ul className="dose-list">
        {rest.map((d) => (
          <li key={d.id} className={`dose ${d.status}`}>
            <span className="dose-time">{d.scheduled_at.slice(11)}</span>
            <span className="dose-name">{d.med_name} <small>{d.dose}</small></span>
            <span className="dose-status">{STATUS[d.status]}</span>
          </li>
        ))}
      </ul>

      <div className="sos-area">
        {sosStep === 'idle' && (
          <button className="btn-sos" onClick={() => setSosStep('confirm')}>SOS</button>
        )}
        {sosStep === 'confirm' && (
          <div className="sos-confirm">
            <p>Trimiți alerta către familie?</p>
            <button className="btn-sos small" onClick={sendSos}>Da, trimite</button>
            <button className="btn-secondary big" onClick={() => setSosStep('idle')}>Anulează</button>
          </div>
        )}
        {sosStep === 'sent' && <p className="sos-sent">Familia a fost anunțată.</p>}
      </div>
    </div>
  );
}
