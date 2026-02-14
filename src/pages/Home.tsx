/**
 * Home — карта мини-проектов
 *
 * Главная страница приложения.
 * Показывает grid-сетку карточек — каждая ведёт на отдельный демо-раздел.
 * Использует Link из react-router-dom для клиентской навигации.
 */

import { Link } from 'react-router-dom';

// Описание всех мини-проектов в одном массиве
const PROJECTS = [
  {
    path: '/hooks/use',
    icon: '~',
    title: 'use()',
    description: 'Чтение Promise и Context прямо в рендере. Замена useEffect + useState для загрузки данных.',
    tag: 'new',
    tagText: 'React 19',
  },
  {
    path: '/hooks/use-action-state',
    icon: '{}',
    title: 'useActionState',
    description: 'Управление состоянием серверных action. Замена ручного useState + isPending.',
    tag: 'new',
    tagText: 'React 19',
  },
  {
    path: '/hooks/use-form-status',
    icon: '?=',
    title: 'useFormStatus',
    description: 'Получение статуса формы из дочерних компонентов без prop drilling.',
    tag: 'new',
    tagText: 'React 19',
  },
  {
    path: '/hooks/use-optimistic',
    icon: '>>',
    title: 'useOptimistic',
    description: 'Мгновенные обновления UI до ответа сервера. Чат с оптимистичной отправкой.',
    tag: 'new',
    tagText: 'React 19',
  },
  {
    path: '/hooks/use-transition',
    icon: '<>',
    title: 'useTransition',
    description: 'Неблокирующие обновления. Тяжёлая фильтрация без "зависания" интерфейса.',
    tag: 'hook',
    tagText: 'Hook',
  },
  {
    path: '/hooks/react19-changes',
    icon: '!!',
    title: 'Изменения React 19',
    description: 'ref как пропс, Context без Provider, cleanup ref-функции.',
    tag: 'new',
    tagText: 'React 19',
  },
  {
    path: '/forms/events',
    icon: 'ev',
    title: 'События форм',
    description: 'onChange, onBlur, onFocus, onSubmit — лог всех событий в реальном времени.',
    tag: 'form',
    tagText: 'Формы',
  },
  {
    path: '/forms/vanilla',
    icon: 'V',
    title: 'Vanilla-валидация',
    description: 'Кастомная валидация без библиотек. Полный контроль над логикой.',
    tag: 'form',
    tagText: 'Формы',
  },
  {
    path: '/forms/yup',
    icon: 'Y',
    title: 'Yup-валидация',
    description: 'Схемная валидация с Yup. Декларативный подход к правилам.',
    tag: 'form',
    tagText: 'Формы',
  },
  {
    path: '/forms/zod',
    icon: 'Z',
    title: 'Zod-валидация',
    description: 'TypeScript-first валидация. Автовывод типов через z.infer.',
    tag: 'form',
    tagText: 'Формы',
  },
  {
    path: '/forms/react-hook-form',
    icon: 'RHF',
    title: 'React Hook Form',
    description: 'useForm + useFieldArray. Динамические формы с минимумом ре-рендеров.',
    tag: 'form',
    tagText: 'Формы',
  },
];

export default function Home() {
  return (
    <div>
      {/* Заголовок страницы */}
      <div className="page-header">
        <h2>React 19 Lab</h2>
        <p>
          Интерактивная карта мини-проектов. Каждая карточка — отдельная тема
          с работающим примером и комментариями в коде.
        </p>
      </div>

      {/* Сетка проектов */}
      <div className="project-grid">
        {PROJECTS.map((project) => (
          <Link to={project.path} className="project-card" key={project.path}>
            <span className="icon">{project.icon}</span>
            <h3>{project.title}</h3>
            <p>{project.description}</p>
            <span className={`tag ${project.tag}`}>{project.tagText}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
