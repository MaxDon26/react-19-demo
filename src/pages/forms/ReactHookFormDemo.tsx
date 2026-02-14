/**
 * ReactHookFormDemo — React Hook Form + useFieldArray (динамические формы)
 *
 * React Hook Form — библиотека для управления формами.
 * Ключевые преимущества:
 * - Неконтролируемые компоненты (минимум ре-рендеров)
 * - Встроенная валидация
 * - Маленький размер (~9KB)
 * - useFieldArray — динамическое добавление/удаление полей
 *
 * Основные хуки:
 * - useForm — главный хук (register, handleSubmit, formState, watch, reset)
 * - useFieldArray — динамические массивы полей
 * - useWatch — подписка на изменения конкретных полей
 * - useFormContext — доступ к форме из вложенных компонентов
 */

import { useForm, useFieldArray, Controller, useWatch } from 'react-hook-form';
import { standardSchemaResolver } from '@hookform/resolvers/standard-schema';
import { z } from 'zod';
import { useState } from 'react';

// ===== Zod-схема для динамической формы команды =====

const teamSchema = z.object({
  teamName: z
    .string()
    .min(1, 'Название обязательно')
    .max(50, 'Максимум 50 символов'),

  description: z
    .string()
    .max(200, 'Максимум 200 символов')
    .optional(),

  /**
   * members — массив объектов.
   * useFieldArray будет управлять этим массивом:
   * добавлять, удалять, перемещать элементы.
   */
  members: z
    .array(
      z.object({
        name: z.string().min(1, 'Имя обязательно'),
        email: z.string().email('Некорректный email'),
        role: z.enum(['developer', 'designer', 'manager', 'tester']),
        level: z.enum(['junior', 'middle', 'senior', 'lead']),
      })
    )
    .min(1, 'Добавьте хотя бы одного участника')
    .max(8, 'Максимум 8 участников'),
});

type TeamFormData = z.infer<typeof teamSchema>;

// ===== Компонент =====

export default function ReactHookFormDemo() {
  const [submitResult, setSubmitResult] = useState<TeamFormData | null>(null);

  /**
   * useForm — главный хук React Hook Form.
   *
   * register — регистрирует поле (возвращает ref, onChange, onBlur, name)
   * control — объект управления формой (нужен для useFieldArray)
   * handleSubmit — валидация → callback
   * formState — состояние формы (errors, isSubmitting, isDirty, ...)
   * watch — наблюдение за значением поля
   * reset — сброс формы
   * setValue — программная установка значения
   */
  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty },
    reset,
    watch,
  } = useForm<TeamFormData>({
    // standardSchemaResolver — универсальный resolver для Zod 4 (Standard Schema spec)
    resolver: standardSchemaResolver(teamSchema),
    mode: 'onBlur',
    defaultValues: {
      teamName: '',
      description: '',
      // Начинаем с одного пустого участника
      members: [
        { name: '', email: '', role: 'developer', level: 'middle' },
      ],
    },
  });

  /**
   * useFieldArray — хук для динамических массивов полей.
   *
   * fields — текущий массив (каждый элемент имеет уникальный id)
   * append — добавить элемент в конец
   * remove — удалить по индексу
   * swap — поменять местами два элемента
   * move — переместить элемент
   * insert — вставить по индексу
   * prepend — добавить в начало
   *
   * ВАЖНО: используйте field.id как key, НЕ index!
   * Индекс меняется при удалении — это вызовет баги.
   */
  const { fields, append, remove } = useFieldArray({
    control, // Связь с useForm
    name: 'members', // Имя поля-массива в схеме
  });

  // Наблюдаем за количеством участников
  const membersCount = watch('members')?.length || 0;

  const onSubmit = async (data: TeamFormData) => {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setSubmitResult(data);
    console.log('Team data:', data);
  };

  return (
    <div>
      <div className="page-header">
        <span className="page-tag form">Формы</span>
        <h2>React Hook Form + Dynamic Fields</h2>
        <p>
          useForm для управления формой, useFieldArray для динамических полей,
          Zod для валидации. Добавляйте и удаляйте участников команды.
        </p>
      </div>

      <div className="info-box info">
        <code>useFieldArray</code> управляет массивом полей: <code>append</code>,{' '}
        <code>remove</code>, <code>swap</code>, <code>move</code>.
        Каждый элемент получает уникальный <code>id</code> — используйте его как key.
      </div>

      {submitResult ? (
        <div className="demo-section">
          <div className="info-box success">
            Команда "{submitResult.teamName}" создана!
            Участников: {submitResult.members.length}
          </div>
          <div className="demo-result">
            <pre>{JSON.stringify(submitResult, null, 2)}</pre>
          </div>
          <button
            className="btn btn-secondary mt-3"
            onClick={() => {
              setSubmitResult(null);
              reset();
            }}
          >
            Создать новую команду
          </button>
        </div>
      ) : (
        <div className="demo-section">
          <form onSubmit={handleSubmit(onSubmit)}>
            {/* Информация о команде */}
            <div className="form-group">
              <label>Название команды *</label>
              <input
                {...register('teamName')}
                className={`form-input ${errors.teamName ? 'error' : ''}`}
                placeholder="Dream Team"
              />
              {errors.teamName && (
                <div className="form-error">{errors.teamName.message}</div>
              )}
            </div>

            <div className="form-group">
              <label>Описание</label>
              <textarea
                {...register('description')}
                className={`form-textarea ${errors.description ? 'error' : ''}`}
                placeholder="Чем занимается команда..."
              />
              {errors.description && (
                <div className="form-error">{errors.description.message}</div>
              )}
            </div>

            <div className="divider" />

            {/* Заголовок секции участников */}
            <div className="flex justify-between items-center mb-3">
              <h3 style={{ fontSize: '16px', fontWeight: 600 }}>
                Участники ({membersCount}/8)
              </h3>
              <button
                type="button"
                className="btn btn-sm btn-outline"
                onClick={() =>
                  append({
                    name: '',
                    email: '',
                    role: 'developer',
                    level: 'middle',
                  })
                }
                disabled={membersCount >= 8}
              >
                + Добавить участника
              </button>
            </div>

            {/* Ошибка массива (минимум 1 участник) */}
            {errors.members?.root && (
              <div className="info-box error mb-3">
                {errors.members.root.message}
              </div>
            )}

            {/* Список участников (динамический) */}
            {fields.map((field, index) => (
              /**
               * ВАЖНО: key={field.id}, НЕ key={index}!
               *
               * field.id — уникальный идентификатор, сгенерированный useFieldArray.
               * Если использовать index — при удалении элемента из середины
               * React "запутается" и покажет неправильные данные.
               */
              <div
                key={field.id}
                style={{
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius)',
                  padding: '16px',
                  marginBottom: '12px',
                  background: 'var(--bg-primary)',
                }}
              >
                <div className="flex justify-between items-center mb-2">
                  <span
                    style={{
                      fontSize: '13px',
                      color: 'var(--text-muted)',
                      fontWeight: 600,
                    }}
                  >
                    Участник #{index + 1}
                  </span>
                  {/* Кнопка удаления (нельзя удалить последнего) */}
                  {fields.length > 1 && (
                    <button
                      type="button"
                      className="btn btn-sm btn-danger"
                      onClick={() => remove(index)}
                    >
                      Удалить
                    </button>
                  )}
                </div>

                {/* Поля участника */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group" style={{ marginBottom: '8px' }}>
                    <label>Имя *</label>
                    {/*
                      register(`members.${index}.name`) — регистрирует
                      вложенное поле массива.
                      Путь: members[0].name, members[1].name, ...
                    */}
                    <input
                      {...register(`members.${index}.name`)}
                      className={`form-input ${errors.members?.[index]?.name ? 'error' : ''}`}
                      placeholder="Имя участника"
                    />
                    {errors.members?.[index]?.name && (
                      <div className="form-error">
                        {errors.members[index]?.name?.message}
                      </div>
                    )}
                  </div>

                  <div className="form-group" style={{ marginBottom: '8px' }}>
                    <label>Email *</label>
                    <input
                      {...register(`members.${index}.email`)}
                      className={`form-input ${errors.members?.[index]?.email ? 'error' : ''}`}
                      placeholder="email@example.com"
                    />
                    {errors.members?.[index]?.email && (
                      <div className="form-error">
                        {errors.members[index]?.email?.message}
                      </div>
                    )}
                  </div>

                  <div className="form-group" style={{ marginBottom: '8px' }}>
                    <label>Роль</label>
                    <select
                      {...register(`members.${index}.role`)}
                      className="form-select"
                    >
                      <option value="developer">Developer</option>
                      <option value="designer">Designer</option>
                      <option value="manager">Manager</option>
                      <option value="tester">Tester</option>
                    </select>
                  </div>

                  <div className="form-group" style={{ marginBottom: '8px' }}>
                    <label>Уровень</label>
                    <select
                      {...register(`members.${index}.level`)}
                      className="form-select"
                    >
                      <option value="junior">Junior</option>
                      <option value="middle">Middle</option>
                      <option value="senior">Senior</option>
                      <option value="lead">Lead</option>
                    </select>
                  </div>
                </div>
              </div>
            ))}

            {/* Кнопки формы */}
            <div className="flex gap-2 mt-3">
              <button
                type="submit"
                className="btn btn-primary"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <span className="spinner" /> Создание...
                  </>
                ) : (
                  'Создать команду'
                )}
              </button>
              {isDirty && (
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => reset()}
                >
                  Сбросить
                </button>
              )}
            </div>
          </form>
        </div>
      )}

      {/* ========================================= */}
      {/* Демо 2: Controller + кастомные компоненты */}
      {/* ========================================= */}
      <ControllerDemo />

      {/* Справка по React Hook Form API */}
      <div className="demo-section mt-3">
        <h3>React Hook Form API</h3>
        <table className="comparison-table">
          <thead>
            <tr>
              <th>Метод / Свойство</th>
              <th>Описание</th>
            </tr>
          </thead>
          <tbody>
            <tr><td><code>register(name)</code></td><td>Регистрирует поле (ref + onChange + onBlur). Только для нативных input/select/textarea</td></tr>
            <tr><td><code>Controller</code></td><td>Обёртка для кастомных компонентов (слайдеры, рейтинги, date-pickers, тоглы)</td></tr>
            <tr><td><code>handleSubmit(fn)</code></td><td>Валидация → вызов fn(data)</td></tr>
            <tr><td><code>formState.errors</code></td><td>Объект ошибок валидации</td></tr>
            <tr><td><code>formState.isSubmitting</code></td><td>true пока submit выполняется</td></tr>
            <tr><td><code>formState.isDirty</code></td><td>true если форма изменена</td></tr>
            <tr><td><code>watch(name)</code></td><td>Наблюдение за значением поля (вызывает ре-рендер всей формы)</td></tr>
            <tr><td><code>useWatch</code></td><td>Наблюдение с изоляцией ре-рендера (только подписанный компонент)</td></tr>
            <tr><td><code>reset()</code></td><td>Сброс к defaultValues</td></tr>
            <tr><td><code>setValue(name, value)</code></td><td>Программная установка значения</td></tr>
            <tr><td><code>useFieldArray</code></td><td>Динамические массивы полей (append, remove, swap, move, insert)</td></tr>
          </tbody>
        </table>
      </div>

      {/* register vs Controller */}
      <div className="demo-section mt-3">
        <h3>register() vs Controller — когда что использовать</h3>
        <table className="comparison-table">
          <thead>
            <tr>
              <th>Критерий</th>
              <th>register()</th>
              <th>Controller</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Для чего</td>
              <td>Нативные <code>&lt;input&gt;</code>, <code>&lt;select&gt;</code>, <code>&lt;textarea&gt;</code></td>
              <td>Кастомные компоненты, библиотечные (MUI, Ant Design, react-select)</td>
            </tr>
            <tr>
              <td>Как работает</td>
              <td>Возвращает <code>ref + onChange + onBlur</code> для спреда</td>
              <td>Передаёт <code>field</code> объект через render-prop</td>
            </tr>
            <tr>
              <td>Ре-рендеры</td>
              <td>Минимум (неконтролируемый)</td>
              <td>При каждом изменении (контролируемый)</td>
            </tr>
            <tr>
              <td>Пример</td>
              <td><code>{'<input {...register("name")} />'}</code></td>
              <td><code>{'<Controller name="rating" render={({field}) => ...} />'}</code></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ===== Кастомные компоненты для демо Controller =====

/**
 * StarRating — кастомный компонент рейтинга.
 *
 * register() НЕ работает с таким компонентом, потому что:
 * - Нет нативного <input> с ref
 * - onChange принимает число, а не event
 * - Нет onBlur от нативного элемента
 *
 * Решение: Controller — передаёт field.onChange / field.onBlur / field.value
 */
function StarRating({
  value = 0,
  onChange,
  onBlur,
  max = 5,
}: {
  value?: number;
  onChange: (value: number) => void;
  onBlur?: () => void;
  max?: number;
}) {
  return (
    <div style={{ display: 'flex', gap: '4px' }} onMouseLeave={onBlur}>
      {Array.from({ length: max }, (_, i) => i + 1).map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          style={{
            background: 'none',
            border: 'none',
            fontSize: '24px',
            cursor: 'pointer',
            color: star <= value ? 'var(--warning)' : 'var(--border)',
            padding: '2px',
          }}
        >
          {star <= value ? '\u2605' : '\u2606'}
        </button>
      ))}
    </div>
  );
}

/**
 * TagInput — кастомный компонент ввода тегов.
 *
 * Пользователь вводит текст и нажимает Enter — тег добавляется.
 * Клик по тегу — удаляет его.
 * Значение = массив строк.
 */
function TagInput({
  value = [],
  onChange,
  onBlur,
  placeholder,
}: {
  value?: string[];
  onChange: (value: string[]) => void;
  onBlur?: () => void;
  placeholder?: string;
}) {
  const [inputValue, setInputValue] = useState('');

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault();
      const tag = inputValue.trim();
      if (tag && !value.includes(tag)) {
        onChange([...value, tag]);
        setInputValue('');
      }
    }
  }

  function removeTag(tag: string) {
    onChange(value.filter((t) => t !== tag));
  }

  return (
    <div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: value.length > 0 ? '8px' : 0 }}>
        {value.map((tag) => (
          <span
            key={tag}
            onClick={() => removeTag(tag)}
            style={{
              background: 'var(--accent)',
              color: 'white',
              padding: '2px 10px',
              borderRadius: '12px',
              fontSize: '13px',
              cursor: 'pointer',
            }}
          >
            {tag} &times;
          </span>
        ))}
      </div>
      <input
        className="form-input"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={onBlur}
        placeholder={placeholder}
      />
    </div>
  );
}

/**
 * Toggle — кастомный переключатель (не checkbox).
 */
function Toggle({
  value = false,
  onChange,
  onBlur,
  label,
}: {
  value?: boolean;
  onChange: (value: boolean) => void;
  onBlur?: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={() => { onChange(!value); onBlur?.(); }}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        padding: 0,
        color: 'var(--text-primary)',
        fontSize: '14px',
      }}
    >
      <div
        style={{
          width: '44px',
          height: '24px',
          borderRadius: '12px',
          background: value ? 'var(--success)' : 'var(--border)',
          position: 'relative',
          transition: 'background 0.2s',
        }}
      >
        <div
          style={{
            width: '20px',
            height: '20px',
            borderRadius: '50%',
            background: 'white',
            position: 'absolute',
            top: '2px',
            left: value ? '22px' : '2px',
            transition: 'left 0.2s',
          }}
        />
      </div>
      {label}
    </button>
  );
}

// ===== Демо Controller =====

/**
 * Zod-схема для формы с кастомными компонентами.
 */
const feedbackSchema = z.object({
  name: z.string().min(1, 'Имя обязательно'),

  // Рейтинг: число от 1 до 5
  rating: z
    .number({ error: 'Поставьте оценку' })
    .min(1, 'Поставьте оценку')
    .max(5, 'Максимум 5'),

  // Теги: массив строк, минимум 1
  tags: z
    .array(z.string())
    .min(1, 'Добавьте хотя бы один тег'),

  // Toggle: boolean
  isPublic: z.boolean(),

  comment: z.string().max(500, 'Максимум 500 символов').optional(),
});

type FeedbackFormData = z.infer<typeof feedbackSchema>;

/**
 * CommentLength — демо useWatch.
 *
 * useWatch подписывается на изменения КОНКРЕТНОГО поля
 * и вызывает ре-рендер ТОЛЬКО этого компонента (не всей формы).
 *
 * watch() из useForm тоже работает, но перерендеривает ВСЮ форму.
 * useWatch — изолированный вариант для производительности.
 */
function CommentLength({ control }: { control: ReturnType<typeof useForm<FeedbackFormData>>['control'] }) {
  // Подписка на поле 'comment' — ре-рендер только этого компонента
  const comment = useWatch({ control, name: 'comment' });
  const len = (comment || '').length;

  return (
    <div style={{
      fontSize: '12px',
      color: len > 400 ? 'var(--error)' : 'var(--text-muted)',
      textAlign: 'right',
    }}>
      {len}/500
    </div>
  );
}

function ControllerDemo() {
  const [submitResult, setSubmitResult] = useState<FeedbackFormData | null>(null);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<FeedbackFormData>({
    resolver: standardSchemaResolver(feedbackSchema),
    mode: 'onBlur',
    defaultValues: {
      name: '',
      rating: 0,
      tags: [],
      isPublic: true,
      comment: '',
    },
  });

  const onSubmit = async (data: FeedbackFormData) => {
    await new Promise((resolve) => setTimeout(resolve, 800));
    setSubmitResult(data);
  };

  return (
    <>
      <div className="demo-section mt-3">
        <h3>Controller — кастомные компоненты</h3>
        <p className="card-description">
          <code>register()</code> работает только с нативными <code>&lt;input&gt;</code>.
          Для кастомных компонентов (рейтинг, теги, тоглы) нужен <code>Controller</code> —
          он передаёт <code>field.onChange</code>, <code>field.value</code>, <code>field.onBlur</code>
          в ваш компонент.
        </p>

        {submitResult ? (
          <>
            <div className="info-box success">Отзыв отправлен!</div>
            <div className="demo-result">
              <pre>{JSON.stringify(submitResult, null, 2)}</pre>
            </div>
            <button
              className="btn btn-secondary mt-3"
              onClick={() => { setSubmitResult(null); reset(); }}
            >
              Заполнить снова
            </button>
          </>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)}>
            {/* Обычное поле — register */}
            <div className="form-group">
              <label>Имя * <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>(register)</span></label>
              <input
                {...register('name')}
                className={`form-input ${errors.name ? 'error' : ''}`}
                placeholder="Ваше имя"
              />
              {errors.name && <div className="form-error">{errors.name.message}</div>}
            </div>

            {/* Кастомный рейтинг — Controller */}
            <div className="form-group">
              <label>Оценка * <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>(Controller)</span></label>
              {/*
                Controller оборачивает кастомный компонент:
                - name — имя поля в схеме
                - control — связь с useForm
                - render — получает { field, fieldState }
                  - field.value — текущее значение
                  - field.onChange — callback для обновления значения
                  - field.onBlur — callback для валидации при потере фокуса
                  - fieldState.error — ошибка для этого поля
              */}
              <Controller
                name="rating"
                control={control}
                render={({ field }) => (
                  <StarRating
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                  />
                )}
              />
              {errors.rating && <div className="form-error">{errors.rating.message}</div>}
            </div>

            {/* Кастомные теги — Controller */}
            <div className="form-group">
              <label>Теги * <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>(Controller)</span></label>
              <Controller
                name="tags"
                control={control}
                render={({ field }) => (
                  <TagInput
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    placeholder="Введите тег и нажмите Enter"
                  />
                )}
              />
              {errors.tags && <div className="form-error">{errors.tags.message}</div>}
              <div className="form-hint">Нажмите Enter для добавления. Клик по тегу — удаление.</div>
            </div>

            {/* Кастомный toggle — Controller */}
            <div className="form-group">
              <label style={{ marginBottom: '8px', display: 'block' }}>
                Видимость <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>(Controller)</span>
              </label>
              <Controller
                name="isPublic"
                control={control}
                render={({ field }) => (
                  <Toggle
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    label={field.value ? 'Публичный отзыв' : 'Приватный отзыв'}
                  />
                )}
              />
            </div>

            {/* Комментарий + useWatch для счётчика символов */}
            <div className="form-group">
              <label>
                Комментарий{' '}
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>(register + useWatch)</span>
              </label>
              <textarea
                {...register('comment')}
                className={`form-textarea ${errors.comment ? 'error' : ''}`}
                placeholder="Ваш отзыв..."
              />
              {/* useWatch подписывается только на 'comment' — перерендерит ТОЛЬКО этот компонент */}
              <CommentLength control={control} />
              {errors.comment && <div className="form-error">{errors.comment.message}</div>}
            </div>

            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              {isSubmitting ? <><span className="spinner" /> Отправка...</> : 'Отправить отзыв'}
            </button>
          </form>
        )}
      </div>

      {/* Пояснение useWatch vs watch */}
      <div className="info-box info mt-3">
        <strong>useWatch vs watch:</strong>{' '}
        <code>watch('comment')</code> подписывается на поле, но перерендеривает <strong>всю форму</strong>.{' '}
        <code>useWatch({'{ name: "comment" }'})</code> изолирует ре-рендер — обновляется только компонент <code>CommentLength</code>.
        Для форм с множеством полей это даёт значительный выигрыш в производительности.
      </div>
    </>
  );
}
