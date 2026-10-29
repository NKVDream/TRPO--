import React, { useEffect, useState } from 'react';

import { modules } from './modules/registry';
import Sidebar from './components/Sidebar';
import HomePage from './components/HomePage';
export default function App() {
  const [page, setPage] = useState(location.hash.slice(1) || 'home');
  useEffect(() => {
    const change = () => {
      setPage(location.hash.slice(1) || 'home');
      window.scrollTo(0, 0);
    };
    window.addEventListener('hashchange', change);
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
