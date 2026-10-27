// UC1 – Ecranul de autentificare si inregistrare aparținator
import { useState } from 'react';
import { api } from '../api.js';

export default function Login({ onLogin }) {
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const data = mode === 'login'
        ? await api('/auth/login', { method: 'POST', body: { email: form.email, password: form.password } })
        : await api('/auth/register', { method: 'POST', body: form });
      onLogin(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card narrow">
      <h1>{mode === 'login' ? 'Autentificare' : 'Cont nou de aparținător'}</h1>
      <form onSubmit={submit} className="form">
        {mode === 'register' && (
          <label>Nume complet
            <input value={form.name} onChange={set('name')} required />
          </label>
        )}
        <label>E-mail
          <input type="email" value={form.email} onChange={set('email')} required autoComplete="username" />
        </label>
        <label>{mode === 'login' ? 'Parolă sau PIN' : 'Parolă (minim 6 caractere)'}
          <input type="password" value={form.password} onChange={set('password')} required autoComplete="current-password" />
        </label>
        {error && <p className="error" role="alert">{error}</p>}
        <button className="btn-primary" disabled={busy}>
          {busy ? 'Se trimite...' : mode === 'login' ? 'Intră' : 'Creează cont'}
        </button>
      </form>
      <p className="muted">
        {mode === 'login' ? 'Nu ai cont? ' : 'Ai deja cont? '}
        <button className="btn-link" onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}>
          {mode === 'login' ? 'Înregistrează-te ca aparținător' : 'Autentifică-te'}
        </button>
      </p>
    </div>
  );
}
