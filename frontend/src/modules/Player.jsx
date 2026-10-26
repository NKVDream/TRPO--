import React, { useState, useRef, useEffect } from 'react';
const format = (n) =>
  Number.isFinite(n)
    ? `${Math.floor(n / 60)}:${String(Math.floor(n % 60)).padStart(2, '0')}`
    : '0:00';
export default function Player() {
  const [tracks, setTracks] = useState([]),
    [index, setIndex] = useState(-1),
    [playing, setPlaying] = useState(false),
    [time, setTime] = useState(0),
    [duration, setDuration] = useState(0),
    [volume, setVolume] = useState(0.7),
    [repeat, setRepeat] = useState(false),
    [shuffle, setShuffle] = useState(false),
    [error, setError] = useState('');
  const audio = useRef(),
    input = useRef(),
    urls = useRef([]),
    autoplay = useRef(false);
  useEffect(() => () => urls.current.forEach(URL.revokeObjectURL), []);
  useEffect(() => {
    audio.current.volume = volume;
  }, [volume]);
  const add = (files) => {
    const added = Array.from(files)
      .filter((f) => f.type.startsWith('audio/') || /\.(mp3|wav|ogg|flac|m4a|aac)$/i.test(f.name))
      .map((f) => {
        const url = URL.createObjectURL(f);
        urls.current.push(url);
        return {
          id: crypto.randomUUID(),
          title: f.name.replace(/\.[^.]+$/, ''),
          url,
          size: f.size,
        };
      });
    setTracks((t) => [...t, ...added]);
    if (index === -1 && added.length) setIndex(0);
    setError(added.length ? '' : 'Выберите аудиофайлы MP3, WAV, OGG или FLAC');
  };
  const play = () =>
    audio.current
      .play()
      .catch(() =>
        setError('Не удалось воспроизвести файл. Проверьте поддержку формата браузером.'),
      );
  const select = (i) => {
    setError('');
    if (i === index) {
      play();
      return;
    }
    autoplay.current = true;
    setTime(0);
    setDuration(0);
    setIndex(i);
  };
  const next = () => {
    if (!tracks.length) return;
    let n =
      shuffle && tracks.length > 1
        ? (index + 1 + Math.floor(Math.random() * (tracks.length - 1))) % tracks.length
        : (index + 1) % tracks.length;
    select(n);
  };
  const remove = (i) => {
    const removed = tracks[i];
    audio.current.pause();
    setTracks((t) => t.filter((_, j) => j !== i));
    URL.revokeObjectURL(removed.url);
    if (i === index) {
      setIndex(-1);
      setTime(0);
      setDuration(0);
    } else if (i < index) setIndex(index - 1);
  };
  return (
    <>
      <div className="module-heading">
        <div>
          <span className="eyebrow">SOUND SPACE / 02</span>
          <h1>Музыкальный проигрыватель</h1>
          <p>Соберите свой ритм рабочего дня.</p>
        </div>
        <button className="primary" onClick={() => input.current.click()}>
          Добавить музыку +
        </button>
        <input
          hidden
          multiple
          ref={input}
          type="file"
          accept="audio/*,.flac,.m4a"
          onChange={(e) => {
            add(e.target.files);
            e.target.value = '';
          }}
        />
      </div>
      <div className="player-grid">
        <section className="now-playing">
          <span className="eyebrow">СЕЙЧАС ИГРАЕТ</span>
          <div className={'record ' + (playing ? 'spinning' : '')}>
            <div className="record-label">
              F<span>FORUM / SOUND</span>
            </div>
          </div>
          <h2>{tracks[index]?.title || 'Ваше пространство звука'}</h2>
          <p>{tracks[index] ? 'Локальная медиатека' : 'Добавьте музыку с компьютера'}</p>
          <div className="seek">
            <input
              aria-label="Позиция воспроизведения"
              type="range"
              min="0"
              max={duration || 0}
              step=".1"
              value={Math.min(time, duration || 0)}
              disabled={!duration}
              onChange={(e) => {
                audio.current.currentTime = +e.target.value;
                setTime(+e.target.value);
              }}
            />
            <div>
              <span>{format(time)}</span>
              <span>{format(duration)}</span>
            </div>
          </div>
          <div className="play-controls">
            <button
              aria-label="Случайный порядок"
              aria-pressed={shuffle}
              className={shuffle ? 'active' : ''}
              onClick={() => setShuffle(!shuffle)}
            >
              ⤨
            </button>
            <button
              aria-label="Предыдущий трек"
              disabled={!tracks.length}
              onClick={() => select((index - 1 + tracks.length) % tracks.length)}
            >
              ❮
            </button>
            <button
              className="play-button"
              aria-label={playing ? 'Пауза' : 'Воспроизвести'}
              disabled={index < 0}
              onClick={() => (playing ? audio.current.pause() : play())}
            >
              {playing ? 'Ⅱ' : '▶'}
            </button>
            <button aria-label="Следующий трек" disabled={!tracks.length} onClick={next}>
              ❯
            </button>
            <button
              aria-label="Повтор трека"
              aria-pressed={repeat}
              className={repeat ? 'active' : ''}
              onClick={() => setRepeat(!repeat)}
            >
              ↻
            </button>
          </div>
          <label className="volume">
            Громкость
            <input
              aria-label="Громкость"
              type="range"
              min="0"
              max="1"
              step=".01"
              value={volume}
              onChange={(e) => setVolume(+e.target.value)}
            />
            <span>{Math.round(volume * 100)}%</span>
          </label>
        </section>
        <section
          className="playlist"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            add(e.dataTransfer.files);
          }}
        >
          <div className="playlist-heading">
            <div>
              <span className="eyebrow">ВАША КОЛЛЕКЦИЯ</span>
              <h2>Плейлист</h2>
            </div>
            <span className="badge">{tracks.length} треков</span>
          </div>
          {tracks.length ? (
            tracks.map((t, i) => (
              <div className={'track ' + (i === index ? 'current' : '')} key={t.id}>
                <button className="track-name" onClick={() => select(i)}>
                  <span>{i === index && playing ? '♫' : String(i + 1).padStart(2, '0')}</span>
                  <div>
                    <strong>{t.title}</strong>
                    <small>Аудиофайл · {(t.size / 1024 / 1024).toFixed(1)} МБ</small>
                  </div>
                  <span>▷</span>
                </button>
                <button aria-label={'Удалить ' + t.title} onClick={() => remove(i)}>
                  ×
                </button>
              </div>
            ))
          ) : (
            <div className="dropzone">
              <span>♫</span>
              <h3>Музыка начинается здесь</h3>
              <p>
                Перетащите аудиофайлы в эту область
                <br />
                или выберите их на компьютере.
              </p>
              <button onClick={() => input.current.click()}>Выбрать файлы ↗</button>
              <small>MP3, WAV, OGG, FLAC*</small>
            </div>
          )}
          <div className="playlist-note">
            Файлы остаются на вашем устройстве.
            <br />* Поддержка форматов зависит от браузера.
          </div>
        </section>
      </div>
      <p role="status" className="status-message">
        {error ||
          'Плейлист хранится в текущей сессии. При закрытии страницы добавьте файлы заново.'}
      </p>
      <audio
        ref={audio}
        src={tracks[index]?.url}
        loop={repeat}
        onLoadedMetadata={() => {
          setDuration(audio.current.duration);
          if (autoplay.current) {
            autoplay.current = false;
            play();
          }
        }}
        onTimeUpdate={() => setTime(audio.current.currentTime)}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => {
          setPlaying(false);
          if (!repeat) next();
        }}
        onError={() => setError('Этот аудиофайл не поддерживается браузером.')}
      />
    </>
  );
}
