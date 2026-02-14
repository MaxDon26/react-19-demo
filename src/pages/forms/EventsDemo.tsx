/**
 * EventsDemo — демонстрация событий форм
 *
 * Показывает ВСЕ основные события форм с лог-панелью:
 * - onChange — при изменении значения поля
 * - onBlur — при потере фокуса
 * - onFocus — при получении фокуса
 * - onSubmit — при отправке формы
 * - onInput — при вводе (до обновления value)
 * - onKeyDown / onKeyUp — при нажатии / отпускании клавиш
 * - onInvalid — при невалидном поле (HTML5 валидация)
 * - onReset — при сбросе формы
 *
 * Лог-панель справа показывает все события в реальном времени.
 */

import { useState, useRef, useCallback } from 'react';

// Тип записи в логе событий
interface EventLogEntry {
  id: number;
  time: string;
  eventName: string;
  target: string;
  value: string;
}

export default function EventsDemo() {
  // Лог событий — массив записей
  const [eventLog, setEventLog] = useState<EventLogEntry[]>([]);

  // Состояние формы (controlled inputs)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'developer',
    bio: '',
    agree: false,
  });

  // Ref для автоскролла лога
  const logRef = useRef<HTMLDivElement>(null);

  // Счётчик ID для записей
  const idRef = useRef(0);

  /**
   * addEvent — добавляет запись в лог событий.
   *
   * Каждое событие React содержит:
   * - e.type — тип события (change, blur, focus, submit, ...)
   * - e.target — DOM-элемент, на котором произошло событие
   * - e.target.name — атрибут name поля
   * - e.target.value — текущее значение поля
   *
   * React использует SyntheticEvent — обёртку над нативным событием.
   * Это обеспечивает кроссбраузерную совместимость.
   */
  const addEvent = useCallback(
    (eventName: string, target: string, value: string) => {
      const now = new Date();
      const time = now.toLocaleTimeString('ru-RU', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        fractionalSecondDigits: 2,
      });

      setEventLog((prev) => [
        ...prev.slice(-50), // Храним последние 50 событий
        {
          id: ++idRef.current,
          time,
          eventName,
          target,
          value,
        },
      ]);

      // Автоскролл лога вниз
      setTimeout(() => {
        logRef.current?.scrollTo({
          top: logRef.current.scrollHeight,
          behavior: 'smooth',
        });
      }, 0);
    },
    []
  );

  /**
   * onChange — вызывается при КАЖДОМ изменении значения поля.
   *
   * Для input type="text" — при каждом нажатии клавиши.
   * Для select — при выборе опции.
   * Для checkbox — при переключении.
   *
   * ВАЖНО: В React onChange работает как onInput в нативном HTML!
   * В нативном HTML onChange срабатывает только при потере фокуса.
   */
  function handleChange(
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) {
    const { name, value, type } = e.target;
    const displayValue =
      type === 'checkbox'
        ? String((e.target as HTMLInputElement).checked)
        : value;

    addEvent('onChange', name, displayValue);

    setFormData((prev) => ({
      ...prev,
      [name]:
        type === 'checkbox'
          ? (e.target as HTMLInputElement).checked
          : value,
    }));
  }

  /**
   * onBlur — вызывается когда поле ТЕРЯЕТ фокус.
   *
   * Типичные применения:
   * - Валидация поля при потере фокуса
   * - Сохранение промежуточного значения
   * - Отправка аналитики
   */
  function handleBlur(
    e: React.FocusEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) {
    addEvent('onBlur', e.target.name, e.target.value);
  }

  /**
   * onFocus — вызывается когда поле ПОЛУЧАЕТ фокус.
   *
   * Типичные применения:
   * - Показ подсказки для поля
   * - Скрытие предыдущей ошибки валидации
   * - Отслеживание пользовательского пути по форме
   */
  function handleFocus(
    e: React.FocusEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) {
    addEvent('onFocus', e.target.name, e.target.value);
  }

  /**
   * onInput — вызывается при ВВОДЕ данных (до обновления value).
   *
   * Разница с onChange в React:
   * - В React onChange ≈ onInput (оба срабатывают при каждом нажатии)
   * - В нативном HTML: onInput = при каждом нажатии, onChange = при blur
   * - В React обычно достаточно onChange, onInput нужен редко
   *
   * Тип: React.SyntheticEvent (НЕ React.FormEvent — он deprecated в React 19,
   * т.к. FormEvent фактически не существует как отдельный тип события)
   */
  function handleInput(
    e: React.SyntheticEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    const target = e.target as HTMLInputElement;
    addEvent('onInput', target.name, target.value);
  }

  /**
   * onKeyDown — вызывается при НАЖАТИИ клавиши.
   *
   * e.key — название клавиши ('Enter', 'Escape', 'a', 'Shift', ...)
   * e.code — физический код клавиши ('KeyA', 'Enter', ...)
   * e.ctrlKey, e.shiftKey, e.altKey — модификаторы
   *
   * Применения:
   * - Отправка формы по Enter
   * - Закрытие модалки по Escape
   * - Горячие клавиши (Ctrl+S)
   */
  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    const target = e.target as HTMLInputElement;
    addEvent('onKeyDown', target.name, `key="${e.key}"`);
  }

  /**
   * onKeyUp — вызывается при ОТПУСКАНИИ клавиши.
   *
   * Разница с onKeyDown:
   * - onKeyDown — момент нажатия (можно preventDefault)
   * - onKeyUp — момент отпускания (действие уже произошло)
   */
  function handleKeyUp(e: React.KeyboardEvent<HTMLInputElement>) {
    const target = e.target as HTMLInputElement;
    addEvent('onKeyUp', target.name, `key="${e.key}"`);
  }

  /**
   * onSubmit — вызывается при отправке формы.
   *
   * e.preventDefault() — предотвращает стандартное поведение
   * (перезагрузку страницы).
   *
   * ВАЖНО: В React 19 можно использовать <form action={fn}>
   * вместо onSubmit + e.preventDefault(). Но для демо событий
   * используем классический подход.
   */
  function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault(); // Без этого страница перезагрузится!
    addEvent('onSubmit', 'form', JSON.stringify(formData));
  }

  /**
   * onReset — вызывается при сбросе формы (кнопка type="reset").
   */
  function handleReset(_e: React.SyntheticEvent<HTMLFormElement>) {
    addEvent('onReset', 'form', 'all fields cleared');
    setFormData({ name: '', email: '', role: 'developer', bio: '', agree: false });
  }

  /**
   * onInvalid — вызывается когда поле не проходит HTML5 валидацию.
   *
   * Срабатывает при submit, если поле с required пустое,
   * или pattern не совпадает, или type="email" содержит невалидный email.
   */
  function handleInvalid(e: React.InvalidEvent<HTMLInputElement>) {
    e.preventDefault(); // Скрываем стандартный попап браузера
    const target = e.target as HTMLInputElement;
    addEvent('onInvalid', target.name, `required field is empty`);
  }

  return (
    <div>
      <div className="page-header">
        <span className="page-tag form">Формы</span>
        <h2>События форм</h2>
        <p>
          Все основные события: onChange, onBlur, onFocus, onSubmit, onInput,
          onKeyDown, onKeyUp, onInvalid, onReset. С логом в реальном времени.
        </p>
      </div>

      <div className="info-box info">
        Взаимодействуйте с формой — все события отображаются в логе справа.
        React использует <code>SyntheticEvent</code> — обёртку над нативными событиями.
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {/* Левая колонка: форма */}
        <div className="demo-section">
          <h3>Форма</h3>

          <form onSubmit={handleSubmit} onReset={handleReset}>
            {/* Текстовое поле — все события */}
            <div className="form-group">
              <label>Имя (onChange + onBlur + onFocus + onKeyDown + onKeyUp + onInput)</label>
              <input
                name="name"
                className="form-input"
                value={formData.name}
                onChange={handleChange}
                onBlur={handleBlur}
                onFocus={handleFocus}
                onInput={handleInput}
                onKeyDown={handleKeyDown}
                onKeyUp={handleKeyUp}
                onInvalid={handleInvalid}
                placeholder="Введите имя"
                required
              />
            </div>

            {/* Email — с HTML5 валидацией */}
            <div className="form-group">
              <label>Email (onChange + onBlur + onFocus + onInvalid)</label>
              <input
                name="email"
                type="email"
                className="form-input"
                value={formData.email}
                onChange={handleChange}
                onBlur={handleBlur}
                onFocus={handleFocus}
                onInvalid={handleInvalid}
                placeholder="email@example.com"
                required
              />
              <div className="form-hint">
                Оставьте пустым и нажмите Submit — увидите onInvalid
              </div>
            </div>

            {/* Select — onChange при выборе */}
            <div className="form-group">
              <label>Роль (onChange + onBlur + onFocus)</label>
              <select
                name="role"
                className="form-select"
                value={formData.role}
                onChange={handleChange}
                onBlur={handleBlur}
                onFocus={handleFocus}
              >
                <option value="developer">Developer</option>
                <option value="designer">Designer</option>
                <option value="manager">Manager</option>
              </select>
            </div>

            {/* Textarea */}
            <div className="form-group">
              <label>Биография (onChange + onBlur + onFocus + onInput)</label>
              <textarea
                name="bio"
                className="form-textarea"
                value={formData.bio}
                onChange={handleChange}
                onBlur={handleBlur}
                onFocus={handleFocus}
                onInput={handleInput}
                placeholder="Расскажите о себе..."
              />
            </div>

            {/* Checkbox */}
            <div className="form-group">
              <label className="form-checkbox">
                <input
                  type="checkbox"
                  name="agree"
                  checked={formData.agree}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  onFocus={handleFocus}
                />
                Согласен с условиями (onChange)
              </label>
            </div>

            <div className="flex gap-2">
              <button type="submit" className="btn btn-primary">
                Submit (onSubmit)
              </button>
              <button type="reset" className="btn btn-secondary">
                Reset (onReset)
              </button>
            </div>
          </form>

          {/* Текущее состояние формы */}
          <div className="demo-result mt-3">
            <pre>{JSON.stringify(formData, null, 2)}</pre>
          </div>
        </div>

        {/* Правая колонка: лог событий */}
        <div className="demo-section">
          <div className="flex justify-between items-center mb-3">
            <h3 style={{ marginBottom: 0 }}>Лог событий</h3>
            <button
              className="btn btn-sm btn-outline"
              onClick={() => setEventLog([])}
            >
              Очистить
            </button>
          </div>

          <div className="event-log" ref={logRef}>
            {eventLog.length === 0 ? (
              <div style={{ color: 'var(--text-muted)', padding: '8px' }}>
                Взаимодействуйте с формой — события появятся здесь
              </div>
            ) : (
              eventLog.map((entry) => (
                <div key={entry.id} className="event-log-item">
                  <span className="time">{entry.time}</span>
                  <span className="event-name">{entry.eventName}</span>
                  <span style={{ color: 'var(--success)' }}>{entry.target}</span>
                  <span className="event-value">{entry.value}</span>
                </div>
              ))
            )}
          </div>

          {/* Справка по событиям */}
          <div className="mt-3" style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            <div><strong>onChange</strong> — при каждом изменении (в React = onInput в HTML)</div>
            <div><strong>onBlur</strong> — потеря фокуса (хорошо для валидации)</div>
            <div><strong>onFocus</strong> — получение фокуса</div>
            <div><strong>onInput</strong> — при вводе (редко нужен в React)</div>
            <div><strong>onKeyDown</strong> — нажатие клавиши (можно preventDefault)</div>
            <div><strong>onKeyUp</strong> — отпускание клавиши</div>
            <div><strong>onSubmit</strong> — отправка формы</div>
            <div><strong>onReset</strong> — сброс формы</div>
            <div><strong>onInvalid</strong> — HTML5 валидация не прошла</div>
          </div>
        </div>
      </div>
    </div>
  );
}
