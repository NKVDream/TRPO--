# Подключение нового модуля

Все пять модулей практики уже реализованы. Их устройство описано отдельно в [каталоге модулей](modules/README.md). Эта инструкция нужна для добавления следующего инструмента, а не для повторного создания текстового редактора.

## Получение и запуск

Основа проекта должна быть закоммичена и отправлена ответственным в GitHub. Для отдельной разработки:

```bash
git clone https://github.com/NKVDream/TRPO--.git
cd TRPO--
git switch -c feature/my-module
npm ci --prefix frontend
dotnet restore backend/Hub.csproj
```

В первом терминале из корня:

```bash
dotnet run --project backend/Hub.csproj
```

Во втором:

```bash
npm run dev --prefix frontend
```

Для разработки откройте адрес Local из вывода Vite, обычно http://127.0.0.1:5173. Запросы /api Vite перенаправляет в C# на 5080. Перезапускайте C# после изменения серверного кода. Страница на 5080 показывает сборку из wwwroot, а не текущие JSX-файлы.

## Фронтенд

1. Создайте frontend/src/modules/MyModule.jsx, экспортирующий React-компонент по умолчанию.
2. Добавьте стили с префиксом модуля; не переопределяйте глобально body, button или input. Общие классы оболочки и workspace-panel можно использовать повторно.
3. Импортируйте компонент в frontend/src/modules/registry.js.
4. Добавьте запись с уникальным id, title, category, description, icon, component: MyModule, available: true.
5. Откройте #id. Меню, карточка, счётчик доступных инструментов и компонент подключатся автоматически. main.jsx и App.jsx для этого менять не нужно.

Пример записи:

```js
{
  id: 'my-module',
  title: 'Мой инструмент',
  category: 'РАБОЧИЕ ИНСТРУМЕНТЫ',
  description: 'Назначение инструмента.',
  icon: '◇',
  component: MyModule,
  available: true,
},
```

Компоненты остаются смонтированными при переключении разделов. Освобождайте подписки и Object URL при размонтировании, блокируйте повторные запросы, показывайте ошибки пользователю. Данные useState не переживают перезагрузку страницы; для долговременного хранения нужен сервер или явно выбранное браузерное хранилище.

## Сервер, если он нужен

- Controllers: HTTP-маршруты, модели запроса, коды ответа. Используйте [ApiController] и [Route("api/my-module")]. Контроллер автоматически найдётся через AddControllers/MapControllers.
- Models: DTO и Data Annotations для обязательных полей и ограничения длины.
- Services: операции и правила, если они сложнее простой проверки DTO. Пример — WorkspaceFileService.
- Data: SQL с параметрами и соединениями через HubDatabase.OpenConnection(). Не обращайтесь к SQLite из браузера.
- Program.cs: регистрации зависимостей AddScoped/AddSingleton. Singleton не должен хранить одно открытое соединение для всех запросов.
- HubDatabase.Initialize: согласованные CREATE TABLE IF NOT EXISTS для новых таблиц. Изменения колонок существующей таблицы требуют отдельной миграции; нельзя удалять пользовательскую БД ради обновления.
- frontend/src/api: функции fetch для нового префикса. Общий request из client.js понимает JSON-ошибки, HTTP 204 и ответы JSON.

Существующие /api/projects предназначены для PNG, /api/documents — для текста, /api/tasks — для задач, /api/files — для рабочих копий. Не смешивайте их модели. Для нового API заранее согласуйте адреса, поля, ограничения и коды ответа.

## Проверка и PR

```bash
npm run format --prefix frontend
npm run format:check --prefix frontend
npm run build --prefix frontend
dotnet format backend/Hub.csproj --no-restore
dotnet build backend/Hub.csproj
python3 scripts/smoke_test.py
```

Smoke test поднимает отдельный сервер со случайным портом и временной БД, проверяет API и очищает тестовые данные. Нужны Python 3 и разрешение на локальные сокеты.

Добавьте описание своего модуля в docs/modules и ссылку в его README. Проверьте модуль в браузере, узкий экран и сохранность работы других инструментов. Коммитьте только свои исходники и документацию, не data, node_modules, bin, obj или wwwroot.

```bash
git status --short
git add <пути-к-своим-файлам>
git diff --cached
git commit -m "Add new module"
git push -u origin feature/my-module
```

На GitHub создайте PR из feature/my-module в main. Опишите возможности, ограничения, API/схему БД, результаты проверок и приложите скриншот. Нужны права collaborator; без них используйте fork и PR в исходный репозиторий. При конфликте registry.js сохраните импорты и записи всех участников. Не заменяйте общий файл целиком своей версией.
