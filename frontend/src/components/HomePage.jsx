import React from 'react';
import { modules } from '../modules/registry';
export default function HomePage() {
  const availableCount = modules.filter((module) => module.available).length;
  return (
    <>
      <section className="hero">
        <div className="hero-content">
          <span className="eyebrow">FORUM WORKSPACE / ОБЩЕЕ ПРОСТРАНСТВО</span>
          <h1>
            Вместе.
            <br />
            От идеи к результату.
          </h1>
          <p>
            Ваши инструменты для творчества и продуктивности.
            <br />
            Одна платформа. Больше возможностей.
          </p>
          <a className="hero-link" href="#editor">
            Начать создавать <span>↗</span>
          </a>
        </div>
        <div className="orbital" aria-hidden="true">
          <i />
          <i />
          <i />
          <div className="orbital-core">
            f
            <span>
              COLLECTIVE
              <br />
              POSSIBILITIES
            </span>
          </div>
          <b className="dot one" />
          <b className="dot two" />
        </div>
        <span className="hero-number">01 — 05 / CONNECTED TOOLS</span>
      </section>
      <div className="section-title">
        <div>
          <span className="eyebrow">ВАШ РАБОЧИЙ НАБОР</span>
          <h2>Инструменты для ваших идей</h2>
        </div>
        <span>
          {String(availableCount).padStart(2, '0')} доступны <b>/</b>{' '}
          {String(modules.length).padStart(2, '0')} модулей
        </span>
      </div>
      <div className="module-cards">
        {modules.map((m, i) => (
          <a
            className={'module-card ' + (!m.available ? 'coming' : '')}
            href={m.available ? '#' + m.id : undefined}
            key={m.id}
          >
            <div className="card-top">
              <span className={'card-icon icon-' + m.id}>{m.icon}</span>
              <span className="module-index">0{i + 1}</span>
            </div>
            <span className="eyebrow">{m.category}</span>
            <h3>{m.title}</h3>
            <p>{m.description}</p>
            <div className="card-bottom">
              <span>{m.available ? 'Открыть инструмент' : 'В разработке команды'}</span>
              <b>{m.available ? '↗' : '· · ·'}</b>
            </div>
          </a>
        ))}
      </div>
      <section className="team-banner">
        <span>◎</span>
        <div>
          <h3>Создаём больше. Вместе.</h3>
          <p>Модульная платформа, в которой у каждой идеи есть своё место.</p>
        </div>
      </section>
    </>
  );
}
