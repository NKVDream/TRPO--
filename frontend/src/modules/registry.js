import TextEditor from './TextEditor.jsx';
import Organizer from './Organizer.jsx';
import FileAttributes from './FileAttributes.jsx';
import Editor from './Editor.jsx';
import Player from './Player.jsx';
// Добавьте компонент и запись сюда: оболочка построит меню и карточку автоматически.
export const modules = [
  {
    id: 'editor',
    title: 'Графический редактор',
    category: 'ВИЗУАЛЬНОЕ ТВОРЧЕСТВО',
    description: 'Рисуйте, создавайте и воплощайте идеи на чистом холсте.',
    icon: '✳',
    component: Editor,
    available: true,
  },
  {
    id: 'player',
    title: 'Музыкальный проигрыватель',
    category: 'МУЗЫКА И ФОКУС',
    description: 'Любимые композиции и ваш собственный ритм работы.',
    icon: '♫',
    component: Player,
    available: true,
  },
  {
    id: 'text',
    title: 'Текстовый редактор',
    category: 'РАБОТА С ТЕКСТОМ',
    description: 'Место для мыслей, заметок и больших историй.',
    icon: 'T',
    component: TextEditor,
    available: true,
  },
  {
    id: 'organizer',
    title: 'Органайзер',
    category: 'ПЛАНИРОВАНИЕ',
    description: 'Задачи и планы, собранные в одном пространстве.',
    icon: '▦',
    component: Organizer,
    available: true,
  },
  {
    id: 'files',
    title: 'Атрибуты файлов',
    category: 'ФАЙЛОВЫЕ ИНСТРУМЕНТЫ',
    description: 'Свойства и атрибуты ваших рабочих файлов.',
    icon: '▤',
    component: FileAttributes,
    available: true,
  },
];
