import { useEffect, useState } from 'react';
import { api, getToken, setToken } from './api.js';
import Login from './pages/Login.jsx';
import ElderHome from './pages/ElderHome.jsx';
import CaregiverDashboard from './pages/CaregiverDashboard.jsx';
import AdminPanel from './pages/AdminPanel.jsx';

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(!!getToken());
  const [highContrast, setHighContrast] = useState(() => localStorage.getItem('eldercare_hc') === '1');

  useEffect(() => {
    if (!getToken()) return;
    api('/auth/me')
      .then(setUser)
      .catch(() => setToken(null))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    document.body.classList.toggle('hc', highContrast);
    localStorage.setItem('eldercare_hc', highContrast ? '1' : '0');
  }, [highContrast]);

  const onLogin = ({ token, user }) => {
    setToken(token);
    setUser(user);
  };
  const logout = () => {
    setToken(null);
    setUser(null);
  };

  if (loading) return <p className="center">Se încarcă...</p>;

  return (
    <div className="app">
      <header className="topbar">
        <span className="logo">ElderCare</span>
        <div className="topbar-actions">
          <button className="btn-link" onClick={() => setHighContrast((v) => !v)}>
            {highContrast ? 'Contrast normal' : 'Contrast ridicat'}
          </button>
          {user && (
            <>
              <span className="user">{user.name}</span>
              <button className="btn-secondary" onClick={logout}>Ieșire</button>
            </>
          )}
        </div>
      </header>
      <main>
        {!user && <Login onLogin={onLogin} />}
        {user?.role === 'elder' && <ElderHome user={user} />}
        {user?.role === 'caregiver' && <CaregiverDashboard />}
        {user?.role === 'admin' && <AdminPanel />}
      </main>
    </div>
  );
}
