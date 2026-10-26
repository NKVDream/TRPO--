import { listProjects, getProject, saveProject } from '../api/client';
import React, { useRef, useState, useEffect } from 'react';
export default function Editor() {
  const canvas = useRef(),
    origin = useRef(),
    drawing = useRef(false),
    history = useRef([]),
    cursor = useRef(-1),
    file = useRef();
  const [tool, setTool] = useState('brush'),
    [color, setColor] = useState('#1674d1'),
    [size, setSize] = useState(5),
    [name, setName] = useState('Без названия'),
    [message, setMessage] = useState(''),
    [projects, setProjects] = useState([]),
    [revision, setRevision] = useState(0),
    [busy, setBusy] = useState(false);
  const snapshot = () => {
    history.current = history.current.slice(0, cursor.current + 1);
    history.current.push(canvas.current.toDataURL());
    if (history.current.length > 25) history.current.shift();
    cursor.current = history.current.length - 1;
    setRevision((x) => x + 1);
  };
  useEffect(() => {
    const c = canvas.current;
    c.getContext('2d').fillStyle = 'white';
    c.getContext('2d').fillRect(0, 0, c.width, c.height);
    snapshot();
  }, []);
  const point = (e) => {
    const r = canvas.current.getBoundingClientRect();
    return {
      x: ((e.clientX - r.left) * canvas.current.width) / r.width,
      y: ((e.clientY - r.top) * canvas.current.height) / r.height,
    };
  };
  const down = (e) => {
    if (e.button !== 0) return;
    const c = canvas.current,
      ctx = c.getContext('2d');
    drawing.current = true;
    c.setPointerCapture(e.pointerId);
    origin.current = { ...point(e), image: ctx.getImageData(0, 0, c.width, c.height) };
    ctx.beginPath();
    ctx.moveTo(origin.current.x, origin.current.y);
    if (tool === 'brush' || tool === 'eraser') {
      ctx.fillStyle = tool === 'eraser' ? '#fff' : color;
      ctx.beginPath();
      ctx.arc(origin.current.x, origin.current.y, size / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(origin.current.x, origin.current.y);
    }
  };
  const move = (e) => {
    if (!drawing.current) return;
    const p = point(e),
      ctx = canvas.current.getContext('2d'),
      o = origin.current;
    ctx.strokeStyle = tool === 'eraser' ? 'white' : color;
    ctx.lineWidth = size;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    if (tool === 'brush' || tool === 'eraser') {
      ctx.lineTo(p.x, p.y);
      ctx.stroke();
    } else {
      ctx.putImageData(o.image, 0, 0);
      ctx.beginPath();
      if (tool === 'rectangle') ctx.rect(o.x, o.y, p.x - o.x, p.y - o.y);
      if (tool === 'ellipse')
        ctx.ellipse(
          (o.x + p.x) / 2,
          (o.y + p.y) / 2,
          Math.abs(p.x - o.x) / 2,
          Math.abs(p.y - o.y) / 2,
          0,
          0,
          Math.PI * 2,
        );
      if (tool === 'line') {
        ctx.moveTo(o.x, o.y);
        ctx.lineTo(p.x, p.y);
      }
      ctx.stroke();
    }
  };
  const end = () => {
    if (drawing.current) {
      drawing.current = false;
      snapshot();
    }
  };
  const loadImage = (src) =>
    new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const c = canvas.current,
          ctx = c.getContext('2d');
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, c.width, c.height);
        const ratio = Math.min(c.width / img.width, c.height / img.height);
        ctx.drawImage(
          img,
          (c.width - img.width * ratio) / 2,
          (c.height - img.height * ratio) / 2,
          img.width * ratio,
          img.height * ratio,
        );
        resolve();
      };
      img.onerror = reject;
      img.src = src;
    });
  const undo = async (delta) => {
    const next = cursor.current + delta;
    if (next < 0 || next >= history.current.length) return;
    await loadImage(history.current[next]);
    cursor.current = next;
    setRevision((x) => x + 1);
  };
  const importImage = async (e) => {
    const f = e.target.files[0];
    if (!f) return;
    const url = URL.createObjectURL(f);
    try {
      await loadImage(url);
      snapshot();
      setName(f.name.replace(/\.[^.]+$/, ''));
    } catch {
      setMessage('Не удалось открыть изображение');
    } finally {
      URL.revokeObjectURL(url);
      e.target.value = '';
    }
  };
  const save = async () => {
    setBusy(true);
    try {
      await saveProject(crypto.randomUUID(), { name, content: canvas.current.toDataURL() });
      setMessage('Проект сохранён в SQLite');
    } catch {
      setMessage('Сервер недоступен. Можно скачать PNG.');
    } finally {
      setBusy(false);
    }
  };
  const list = async () => {
    try {
      const p = await listProjects();
      setProjects(p);
      setMessage(p.length ? 'Выберите сохранённый проект' : 'Сохранённых проектов пока нет');
    } catch {
      setMessage('Для библиотеки запустите C# сервер');
    }
  };
  const open = async (id) => {
    try {
      const p = await getProject(id);
      await loadImage(p.content);
      snapshot();
      setName(p.name);
      setProjects([]);
      setMessage('Проект открыт');
    } catch {
      setMessage('Не удалось открыть проект');
    }
  };
  return (
    <>
      <div className="module-heading">
        <div>
          <span className="eyebrow">CREATIVE STUDIO / 01</span>
          <h1>Графический редактор</h1>
          <p>От первой идеи до готового изображения.</p>
        </div>
        <button className="primary" disabled={busy} onClick={save}>
          {busy ? 'Сохранение…' : 'Сохранить проект ↗'}
        </button>
      </div>
      <div className="editor-top">
        <input
          aria-label="Название проекта"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <span>1200 × 720 px</span>
        <button onClick={() => file.current.click()}>Открыть изображение</button>
        <button onClick={list}>Мои проекты</button>
        <button
          onClick={() => {
            const a = document.createElement('a');
            a.download = (name || 'image') + '.png';
            a.href = canvas.current.toDataURL();
            a.click();
          }}
        >
          Экспорт PNG ↓
        </button>
        <input hidden ref={file} type="file" accept="image/*" onChange={importImage} />
      </div>
      <div className="editor-layout">
        <aside className="tools">
          <span className="eyebrow">ИНСТРУМЕНТЫ</span>
          {[
            ['brush', '✎', 'Кисть'],
            ['eraser', '▱', 'Ластик'],
            ['line', '╱', 'Линия'],
            ['rectangle', '□', 'Прямоугольник'],
            ['ellipse', '○', 'Эллипс'],
          ].map(([id, icon, label]) => (
            <button key={id} className={tool === id ? 'selected' : ''} onClick={() => setTool(id)}>
              <b>{icon}</b>
              {label}
            </button>
          ))}
          <hr />
          <label>
            Цвет{' '}
            <input
              aria-label="Цвет кисти"
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
            />
          </label>
          <div className="swatches">
            {['#10294b', '#1674d1', '#26b6c9', '#e76952', '#f3c85b', '#222222'].map((c) => (
              <button
                key={c}
                aria-label={'Цвет ' + c}
                style={{ background: c }}
                onClick={() => setColor(c)}
              />
            ))}
          </div>
          <label>
            Толщина <strong>{size} px</strong>
            <input
              aria-label="Толщина кисти"
              type="range"
              min="1"
              max="50"
              value={size}
              onChange={(e) => setSize(+e.target.value)}
            />
          </label>
          <hr />
          <button disabled={cursor.current <= 0} onClick={() => undo(-1)}>
            ↶ Отменить
          </button>
          <button disabled={cursor.current >= history.current.length - 1} onClick={() => undo(1)}>
            ↷ Повторить
          </button>
          <button
            onClick={() => {
              if (confirm('Очистить холст?')) {
                const c = canvas.current,
                  ctx = c.getContext('2d');
                ctx.fillStyle = 'white';
                ctx.fillRect(0, 0, c.width, c.height);
                snapshot();
              }
            }}
          >
            Очистить холст
          </button>
        </aside>
        <div className="canvas-area">
          <canvas
            ref={canvas}
            width="1200"
            height="720"
            onPointerDown={down}
            onPointerMove={move}
            onPointerUp={end}
            onPointerCancel={end}
          />
          <div className="canvas-caption">
            <span>Холст · {tool === 'eraser' ? 'ластик' : 'рисование'}</span>
            <span>PNG · RGB</span>
          </div>
        </div>
      </div>
      <div role="status" className="status-message">
        {message || 'Совет: выберите инструмент и начните рисовать на холсте.'}
      </div>
      {projects.length > 0 && (
        <div className="project-list">
          {projects.map((p) => (
            <button key={p.id} onClick={() => open(p.id)}>
              {p.name} ↗
            </button>
          ))}
        </div>
      )}
    </>
  );
}
