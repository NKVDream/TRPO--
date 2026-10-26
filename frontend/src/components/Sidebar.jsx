import React from 'react';
import { modules } from '../modules/registry';
export default function Sidebar({ page }) {
  return (
    <aside className="sidebar">
      <a className="brand" href="#home">
        FORUM<span>WORKSPACE</span>
        <i />
      </a>
      <a className={'nav-home ' + (page === 'home' ? 'chosen' : '')} href="#home">
        <span>⊞</span>Обзор пространства <b>↗</b>
      </a>
      <span className="nav-label">ИНСТРУМЕНТЫ</span>
      <nav>
        {modules.map((m) => (
          <a
            key={m.id}
            href={m.available ? '#' + m.id : undefined}
            aria-disabled={!m.available}
            className={(page === m.id ? 'chosen ' : '') + (!m.available ? 'unavailable' : '')}
          >
            <span>{m.icon}</span>
            {m.title}
            {!m.available && <small>Скоро</small>}
          </a>
        ))}
      </nav>
    </aside>
  );
}
