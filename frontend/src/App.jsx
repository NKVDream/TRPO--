import React, { useEffect, useState } from 'react';

import { modules } from './modules/registry';
import Sidebar from './components/Sidebar';
import HomePage from './components/HomePage';
import { getHealth } from './api/client';
export default function App() {
  const [page, setPage] = useState(location.hash.slice(1) || 'home'),
    [health, setHealth] = useState(false);
  useEffect(() => {
    const change = () => {
      setPage(location.hash.slice(1) || 'home');
      window.scrollTo(0, 0);
    };
    window.addEventListener('hashchange', change);
    getHealth()
      .then((d) => setHealth(d.status === 'ok'))
      .catch(() => setHealth(false));
    return () => window.removeEventListener('hashchange', change);
  }, []);
  const active = modules.find((m) => m.id === page && m.available);
  return (
    <div className="shell">
      <Sidebar page={page} />
      <div className="body">
        <header>
          <div>
            Рабочее пространство <span>/</span> {active?.title || 'Обзор'}
          </div>
          <div className="header-right">
            <span className={'server ' + (health ? 'online' : '')}>
              {health ? 'Сервер подключён' : 'Локальный режим'}
            </span>
            <span className="avatar">TR</span>
          </div>
        </header>
        <main>
          <div hidden={page !== 'home'}>
            <HomePage />
          </div>
          {modules
            .filter((m) => m.available)
            .map((m) => (
              <div key={m.id} hidden={page !== m.id}>
                <m.component />
              </div>
            ))}
          {page !== 'home' && !active && (
            <div>
              <h1>Модуль недоступен</h1>
              <a href="#home">Вернуться к обзору</a>
            </div>
          )}
        </main>
        <footer>
          <span>FORUM WORKSPACE</span>
        </footer>
      </div>
    </div>
  );
}
