# Инструкция участнику команды

Эта инструкция показывает подключение текстового редактора в текущий FORUM Workspace. Пример создаёт рабочий редактор TXT с открытием и скачиванием файлов. Сохранение текстов в SQLite — отдельное расширение, описанное ниже. Команды выполняются из корня клонированного репозитория, если явно не указано другое. На Windows используйте Git Bash для команд Git; npm и dotnet можно запускать в PowerShell.


## 1. Участнику — получить проект и создать ветку

Установите Git, Node.js с npm и .NET SDK 8. Проверьте:

```bash
git --version
node --version
npm --version
dotnet --list-sdks
```

Для этого проекта нужен Node.js 18+; используйте установленную поддерживаемую LTS-версию. В списке .NET должен быть SDK 8.x.

Клонируйте репозиторий:

```bash
git clone https://github.com/NKVDream/TRPO--.git
cd TRPO--
git switch main
git pull --ff-only origin main
git switch -c feature/text-editor
```

Если проект уже клонирован, пропустите clone и cd, откройте его корневую папку. Перед переключением веток завершите или сохраните текущие изменения. У каждого участника своя ветка: feature/text-editor, feature/organizer или feature/file-attributes.

## 2. Запустить исходный проект

Из корня репозитория:

```bash
npm ci --prefix frontend
dotnet restore backend/Hub.csproj
```

В первом терминале из корня:

```bash
dotnet run --project backend/Hub.csproj
```

Во втором терминале из того же корня:

```bash
npm run dev --prefix frontend
```

Откройте адрес Local из вывода Vite, обычно http://127.0.0.1:5173. В верхней панели должно быть «Сервер подключён».

Разрабатывайте через адрес Vite: изменения React автоматически видны в браузере. Порт 5080 — C# API; при едином запуске он также отдаёт ранее собранный сайт из wwwroot. Если смотреть на 5080 во время редактирования JSX, можно видеть старую сборку. Изменения C# требуют перезапуска dotnet run.

## 3. Создать компонент текстового редактора

Создайте файл `frontend/src/modules/TextEditor.jsx` и вставьте:

```jsx
import React, { useRef, useState } from 'react';
import './TextEditor.css';

export default function TextEditor() {
  const fileInput = useRef(null);
  const [name, setName] = useState('Заметка');
  const [text, setText] = useState('');
  const [message, setMessage] = useState('');

  async function openFile(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const content = await file.text();
      setText(content);
      setName(file.name.replace(/\.txt$/i, ''));
      setMessage('Файл открыт');
    } catch {
      setMessage('Не удалось прочитать файл');
    } finally {
      event.target.value = '';
    }
  }

  function downloadFile() {
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${name.trim() || 'Заметка'}.txt`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setMessage('TXT передан браузеру для скачивания');
  }

  return (
    <section className="text-editor">
      <div className="module-heading">
        <div>
          <span className="eyebrow">РАБОТА С ТЕКСТОМ / 03</span>
          <h1>Текстовый редактор</h1>
          <p>Открывайте, редактируйте и сохраняйте текстовые файлы.</p>
        </div>
        <button className="primary" onClick={downloadFile}>
          Скачать TXT ↓
        </button>
      </div>

      <div className="text-editor-toolbar">
        <input
          aria-label="Название документа"
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
        <button onClick={() => fileInput.current.click()}>Открыть TXT</button>
        <input
          ref={fileInput}
          hidden
          type="file"
          accept=".txt,text/plain"
          onChange={openFile}
        />
      </div>

      <textarea
        aria-label="Текст документа"
        value={text}
        onChange={(event) => setText(event.target.value)}
        placeholder="Начните писать…"
      />
      <p className="status-message" role="status">
        {message || `Символов: ${text.length}`}
      </p>
      <p className="status-message">
        Перед перезагрузкой страницы скачайте документ: текст хранится в памяти.
      </p>
    </section>
  );
}
```

Это минимальная основа: обычный текст UTF-8, без форматирования DOCX и без базы данных. Кнопка скачивания сохраняет новый файл через браузер, а не перезаписывает исходный файл на диске.

## 4. Добавить стили модуля

Создайте `frontend/src/modules/TextEditor.css`:

```css
.text-editor-toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 16px;
}

.text-editor-toolbar input:not([hidden]) {
  flex: 1;
  min-width: 180px;
  padding: 12px;
  border: 1px solid #dce3ed;
  color: #18375a;
  background: white;
}

.text-editor textarea {
  display: block;
  width: 100%;
  min-height: 420px;
  padding: 24px;
  resize: vertical;
  border: 1px solid #dce3ed;
  background: white;
  color: #132e50;
  font: inherit;
  line-height: 1.7;
}
```

Общие классы module-heading, primary, eyebrow и status-message уже есть в style.css. Новые селекторы начинайте с text-editor, чтобы случайно не изменить другие модули. Не добавляйте глобальные правила textarea, input, button, body или h1 в CSS модуля.

## 5. Подключить компонент к хабу

Откройте `frontend/src/modules/registry.js`.

В начало файла добавьте импорт:

```js
import TextEditor from './TextEditor.jsx';
```

Найдите существующую запись с `id: 'text'` и замените только её:

```js
{
  id: 'text',
  title: 'Текстовый редактор',
  category: 'РАБОТА С ТЕКСТОМ',
  description: 'Открывайте, редактируйте и сохраняйте текстовые файлы.',
  icon: 'T',
  component: TextEditor,
  available: true,
},
```

Не добавляйте вторую запись с тем же id. Не меняйте id text: это адрес модуля. App автоматически покажет компонент, Sidebar — пункт меню, HomePage — карточку. main.jsx, App.jsx и Sidebar.jsx менять для подключения не требуется.

Откройте http://127.0.0.1:5173/#text (если Vite выбрал другой порт, используйте его). В меню и карточке модуль станет доступным.

Известная деталь оболочки: над карточками в HomePage.jsx пока написано фиксированное «02 доступны / 05 модулей». При приёмке третьего модуля ответственный за хаб должен обновить этот счётчик или вычислять его из registry. Это не мешает подключению самого компонента.

## 6. Определить, нужен ли сервер

Для ввода текста, открытия TXT и скачивания TXT серверный код не нужен. Эту минимальную версию уже можно сдавать на проверку команде, если она соответствует согласованному ТЗ.

Если в ТЗ нужно хранить тексты в SQLite и открывать их после перезагрузки, сделайте отдельное API документов. Существующий /api/projects предназначен для PNG: отправка обычного текста в него даст ошибку 400.

Согласуйте контракт до реализации:

| Метод | Адрес | Назначение | Ответ |
| --- | --- | --- | --- |
| GET | /api/documents | Список документов | 200: массив id, name, updated |
| GET | /api/documents/{id} | Открытие документа | 200: id, name, content; 404, если нет |
| PUT | /api/documents/{id} | Создание/обновление | JSON-запрос name, content; ответ 200 или 400 |

Для PUT предлагается максимум 200 символов в названии и 1 млн символов текста. Пустой content допустим; пустое name — ошибка. Это предлагаемый контракт нового модуля, сейчас этих маршрутов в сервере нет.

Создайте файлы по образцу существующего API рисунков:

```text
backend/Models/Document.cs
backend/Data/DocumentRepository.cs
backend/Services/DocumentService.cs
backend/Controllers/DocumentsController.cs
frontend/src/api/documents.js
```

Порядок работы:

1. В Models опишите модель документа и входной JSON. Не используйте Required для content, если разрешён пустой документ; отдельно обработайте null.
2. В HubDatabase.Initialize добавьте отдельную таблицу documents с полями id, name, content, updated. Используйте CREATE TABLE IF NOT EXISTS. Существующую таблицу projects и файлы пользовательской базы не изменяйте и не удаляйте.
3. DocumentRepository получает HubDatabase в конструкторе; соединение открывается через database.OpenConnection(). SQL только с параметрами. Смотрите ProjectRepository.cs.
4. DocumentService проверяет название, наличие content и размер, затем вызывает репозиторий. Смотрите ProjectService.cs.
5. DocumentsController получает DocumentService; добавьте [ApiController], [Route("api/documents")], [HttpGet], [HttpGet("{id}")] и [HttpPut("{id}")]. Смотрите ProjectsController.cs.
6. В Program.cs рядом с существующими регистрациями добавьте builder.Services.AddScoped<DocumentRepository>(); и builder.Services.AddScoped<DocumentService>();. Пространства имён используйте Hub.Data, Hub.Models, Hub.Services и Hub.Controllers соответственно. Контроллер отдельно регистрировать не нужно.
7. В frontend/src/api/documents.js добавьте fetch-функции для /api/documents, проверяйте response.ok и обрабатывайте ошибки в интерфейсе. Можно взять api/client.js за образец.
8. В TextEditor добавьте кнопки сохранения и открытия. Создавайте UUID для нового документа, сохраняйте выбранный id в состоянии и используйте его при последующих сохранениях — так редактирование обновит документ.
9. Перезапустите сервер. Проверьте сохранение и открытие после перезагрузки браузера и перезапуска C#.

Добавление новой таблицы через IF NOT EXISTS не изменяет структуру уже существующей таблицы. Для последующих изменений колонок согласуйте миграцию с ответственным за БД.

## 7. Проверить модуль перед отправкой

Ручная проверка минимального редактора:

- Открывается карточкой, меню и прямым адресом #text.
- Можно вводить и менять название и текст.
- Открывается TXT UTF-8 с русским текстом и переносами строк.
- Скачанный TXT содержит введённый текст и открывается обычным редактором.
- Пустой документ скачивается без ошибки.
- После переключения на проигрыватель и обратно текст остаётся.
- После перезагрузки текст сбрасывается; интерфейс заранее сообщает об этом.
- Интерфейс помещается на узком экране; поля и кнопки доступны клавиатурой.
- Редактор изображений и проигрыватель продолжают открываться.

Если есть API, дополнительно проверьте сохранение/открытие, обновление того же id, 404 для неизвестного id, 400 для недопустимых данных и понятное сообщение при выключенном сервере.

Команды из корня:

```bash
npm run format --prefix frontend
npm run format:check --prefix frontend
npm run build --prefix frontend
dotnet build backend/Hub.csproj
```

При изменении C# также выполните:

```bash
dotnet format backend/Hub.csproj --no-restore
```

Просмотрите git diff: форматирование могло затронуть общие файлы. Не включайте посторонние изменения в свой PR. Добавьте сценарии своего модуля в docs/testing.md и обновите README, чтобы он больше не называл модуль нереализованным.

## 8. Отправить работу на проверку

Для минимального примера:

```bash
git status --short
git add frontend/src/modules/TextEditor.jsx frontend/src/modules/TextEditor.css frontend/src/modules/registry.js docs/testing.md README.md
git diff --cached
git commit -m "Add text editor module"
git push -u origin feature/text-editor
```

Если добавляли API, перед коммитом отдельно добавьте только свои серверные файлы, API-клиент и согласованные изменения Program.cs и HubDatabase.cs. Не добавляйте node_modules, bin, obj, wwwroot и data/hub.db — они исключены через .gitignore.

На GitHub откройте репозиторий → Pull requests → New pull request. Base: main, compare: feature/text-editor. Укажите:

- Что реализовано и что пока не реализовано.
- Какие команды проверки прошли.
- Какие ручные сценарии проверены.
- Скриншот модуля.
- Изменения API и схемы БД, если есть.

Нажмите Create pull request и передайте ссылку ответственному за интеграцию. После замечаний делайте новые коммиты в той же ветке и git push — PR обновится. Не отправляйте изменения напрямую в main.

При отсутствии права push создайте fork на GitHub и клонируйте свой fork вместо общего origin. Ветка и работа те же; PR откройте из ветки своего fork в NKVDream/TRPO--:main.

## 9. Ответственному за интеграцию — принять модуль

Проверьте PR, запустите сборки и ручные сценарии, проверьте совместимость registry и серверных регистраций с другими модулями. Если несколько участников меняли registry.js, сохраните записи каждого модуля. После успешной проверки объедините PR в main. Участники получают обновления через git switch main и git pull --ff-only origin main после завершения своей текущей работы.

## Частые затруднения

| Симптом | Что проверить |
| --- | --- |
| При клонировании есть только README | Ответственный ещё не отправил основу хаба |
| Модуль помечен «Скоро» | available должно быть true, component должен быть указан |
| Ошибка импорта | Имя файла и регистр букв должны точно совпадать, особенно на Linux |
| Изменения JSX не видны | Откройте адрес Vite, а не старую сборку на 5080 |
| «Локальный режим» | Запустите C#; проверьте порт 5080 и frontend/vite.config.js |
| Address already in use | Сервер уже запущен; остановите свой предыдущий процесс, не запускайте второй |
| 400 при сохранении текста в projects | Этот API принимает PNG; для текстов нужен documents |
| push: permission denied | Нужны права collaborator либо fork и PR |
| Конфликт registry.js | Сохраните оба импорта и изменения разных модулей; не заменяйте файл целиком |

О том, как устроены контроллеры и запросы, читайте [architecture.md](architecture.md).
