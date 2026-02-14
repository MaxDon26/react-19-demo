# React 19 Lab

Интерактивная демо-площадка для изучения новых возможностей React 19. Каждый раздел — работающий пример с комментариями в коде.

## Что внутри

### Хуки React 19

| Раздел | Что демонстрирует |
|---|---|
| `use()` | Чтение Promise и Context прямо в рендере — замена useEffect + useState для загрузки данных |
| `useActionState` | Управление состоянием серверных action — замена ручного useState + isPending |
| `useFormStatus` | Получение статуса формы из дочерних компонентов без prop drilling |
| `useOptimistic` | Мгновенные обновления UI до ответа сервера (чат с оптимистичной отправкой) |
| `useTransition` | Неблокирующие обновления — тяжёлая фильтрация без "зависания" интерфейса |
| Изменения React 19 | ref как пропс, Context без Provider, cleanup ref-функции |

### Формы и валидация

| Раздел | Что демонстрирует |
|---|---|
| События форм | onChange, onBlur, onFocus, onSubmit — лог событий в реальном времени |
| Vanilla-валидация | Кастомная валидация без библиотек |
| Yup | Схемная валидация, декларативный подход |
| Zod | TypeScript-first валидация с автовыводом типов через `z.infer` |
| React Hook Form | useForm + useFieldArray — динамические формы с минимумом ре-рендеров |

## Стек

- **React 19** + TypeScript
- **Vite 7** — сборка и dev-сервер
- **react-router-dom v7** — клиентская маршрутизация
- **react-hook-form** — формы
- **yup** / **zod** — валидация

## Запуск

```bash
npm install
npm run dev
```

Откроется на `http://localhost:5173`

## Команды

| Команда | Описание |
|---|---|
| `npm run dev` | Dev-сервер с HMR |
| `npm run build` | Сборка для продакшена |
| `npm run preview` | Превью собранной версии |
| `npm run lint` | Проверка ESLint |

## Структура

```
src/
├── components/
│   └── Layout.tsx          # Общий layout с sidebar
├── pages/
│   ├── Home.tsx            # Главная — карта проектов
│   ├── hooks/              # Демо хуков React 19
│   │   ├── UseDemo.tsx
│   │   ├── UseActionStateDemo.tsx
│   │   ├── UseFormStatusDemo.tsx
│   │   ├── UseOptimisticDemo.tsx
│   │   ├── UseTransitionDemo.tsx
│   │   └── React19Changes.tsx
│   └── forms/              # Демо форм и валидации
│       ├── EventsDemo.tsx
│       ├── VanillaValidation.tsx
│       ├── YupValidation.tsx
│       ├── ZodValidation.tsx
│       └── ReactHookFormDemo.tsx
├── utils/
│   └── api.ts              # Утилиты для имитации API
├── App.tsx                 # Корневой компонент + роутинг
└── main.tsx                # Точка входа
```
