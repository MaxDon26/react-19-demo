/**
 * UseOptimisticDemo — демонстрация useOptimistic из React 19
 *
 * useOptimistic — хук для МГНОВЕННОГО обновления UI,
 * пока реальный запрос на сервер ещё выполняется.
 *
 * Паттерн "оптимистичные обновления":
 * 1. Пользователь нажимает кнопку → UI обновляется СРАЗУ
 * 2. Запрос уходит на сервер
 * 3. Если успех → оптимистичное значение заменяется реальным
 * 4. Если ошибка → автоматический откат к предыдущему состоянию
 *
 * Сигнатура:
 *   const [optimisticState, addOptimistic] = useOptimistic(
 *     actualState,      // реальное текущее состояние
 *     updateFn          // (currentState, optimisticValue) => newState
 *   );
 */

import { useOptimistic, useState, useRef, useTransition } from 'react';
import { sendMessage, delay, type Message } from '../../utils/api';

// ===== Начальные данные чата =====
const INITIAL_MESSAGES: Message[] = [
  {
    id: 1,
    text: 'Привет! Это демо оптимистичных обновлений.',
    author: 'Система',
    timestamp: Date.now() - 60000,
  },
  {
    id: 2,
    text: 'Отправь сообщение — оно появится мгновенно, до ответа сервера.',
    author: 'Система',
    timestamp: Date.now() - 30000,
  },
];

// ===== Пример 2: Лайки =====

interface LikeableItem {
  id: number;
  title: string;
  likes: number;
  liked: boolean;
}

const INITIAL_ITEMS: LikeableItem[] = [
  { id: 1, title: 'React 19 — новые хуки', likes: 42, liked: false },
  { id: 2, title: 'TypeScript 5.x — type inference', likes: 38, liked: false },
  { id: 3, title: 'Vite — сборка проектов', likes: 55, liked: true },
];

// ===== Пример 3: Удаление с откатом при ошибке =====

interface Task {
  id: number;
  text: string;
}

const INITIAL_TASKS: Task[] = [
  { id: 1, text: 'Изучить useOptimistic' },
  { id: 2, text: 'Написать тесты' },
  { id: 3, text: 'Сделать код-ревью' },
  { id: 4, text: 'Обновить документацию' },
];

export default function UseOptimisticDemo() {
  // ===== Чат =====

  // messages — реальное состояние (то, что подтверждено сервером)
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);

  // Ref для отслеживания ошибок
  const [error, setError] = useState<string | null>(null);

  // Ref для скролла к последнему сообщению
  const messagesEndRef = useRef<HTMLDivElement>(null);

  /**
   * useOptimistic принимает:
   * 1. messages — реальное состояние
   * 2. Функция-обновлятор: (текущее состояние, оптимистичное значение) => новое состояние
   *
   * optimisticMessages — включает и реальные, и оптимистичные сообщения
   * addOptimisticMessage — добавляет оптимистичное сообщение
   */
  const [optimisticMessages, addOptimisticMessage] = useOptimistic(
    messages,
    // Функция обновления: добавляем новое сообщение с флагом sending
    (currentMessages: Message[], newMessageText: string) => [
      ...currentMessages,
      {
        id: Date.now(),
        text: newMessageText,
        author: 'Вы',
        timestamp: Date.now(),
        sending: true, // Этот флаг показывает, что сообщение ещё отправляется
      },
    ]
  );

  /**
   * Обработчик отправки сообщения.
   * Порядок:
   * 1. addOptimisticMessage → UI обновляется МГНОВЕННО
   * 2. sendMessage() → запрос уходит на сервер (1.2с)
   * 3. setMessages → реальное состояние обновляется
   *    → React заменяет оптимистичное значение реальным
   * 4. Если ошибка → React откатывает к предыдущему messages
   */
  async function handleSendMessage(formData: FormData) {
    const text = formData.get('message') as string;
    if (!text.trim()) return;

    setError(null);

    // 1. МГНОВЕННО показываем сообщение в UI (оптимистично)
    addOptimisticMessage(text);

    try {
      // 2. Отправляем на сервер (асинхронно)
      const serverMessage = await sendMessage(text);

      // 3. Обновляем РЕАЛЬНОЕ состояние
      // React автоматически уберёт оптимистичное и покажет реальное
      setMessages((prev) => [...prev, serverMessage]);
    } catch (err) {
      // 4. При ошибке — React откатывает optimisticMessages к messages
      // Оптимистичное сообщение исчезнет автоматически!
      setError(
        err instanceof Error ? err.message : 'Ошибка отправки'
      );
    }
  }

  // ===== Лайки =====

  const [items, setItems] = useState<LikeableItem[]>(INITIAL_ITEMS);

  const [optimisticItems, updateOptimisticItem] = useOptimistic(
    items,
    // При оптимистичном обновлении: переключаем лайк у конкретного элемента
    (currentItems: LikeableItem[], itemId: number) =>
      currentItems.map((item) =>
        item.id === itemId
          ? {
              ...item,
              liked: !item.liked,
              likes: item.liked ? item.likes - 1 : item.likes + 1,
            }
          : item
      )
  );

  /**
   * useTransition нужен для useOptimistic вне form action.
   *
   * React 19 ТРЕБУЕТ, чтобы оптимистичное обновление
   * происходило внутри transition или form action.
   * Иначе — ошибка: "An optimistic state update occurred
   * outside a transition or action."
   *
   * startTransition оборачивает async-функцию:
   * - Пока async-функция не завершится, React показывает оптимистичное значение
   * - Когда завершится — заменяет на реальное состояние
   */
  const [isLikePending, startLikeTransition] = useTransition();

  function handleToggleLike(itemId: number) {
    startLikeTransition(async () => {
      // Мгновенное обновление UI (внутри transition — всё корректно)
      updateOptimisticItem(itemId);

      // Имитация запроса на сервер
      await delay(1000);

      // Обновляем реальное состояние
      setItems((prev) =>
        prev.map((item) =>
          item.id === itemId
            ? {
                ...item,
                liked: !item.liked,
                likes: item.liked ? item.likes - 1 : item.likes + 1,
              }
            : item
        )
      );
    });
  }

  // ===== Пример 3: Удаление с откатом при ошибке =====

  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);

  // Переключатель: имитировать ли ошибку сервера
  const [serverFails, setServerFails] = useState(false);

  // Ошибка удаления (для отображения пользователю)
  const [deleteError, setDeleteError] = useState<string | null>(null);

  /**
   * useOptimistic для задач.
   * updateFn фильтрует задачу по id — удаляет из списка оптимистично.
   */
  const [optimisticTasks, removeOptimisticTask] = useOptimistic(
    tasks,
    (currentTasks: Task[], taskId: number) =>
      currentTasks.filter((t) => t.id !== taskId)
  );

  const [isDeletePending, startDeleteTransition] = useTransition();

  /**
   * handleDeleteTask — удаление с демонстрацией отката.
   *
   * Сценарий при serverFails = true:
   * 1. UI мгновенно удаляет задачу (оптимистично)
   * 2. Запрос "падает" через 1.5с
   * 3. startTransition завершается с ошибкой
   * 4. React видит, что realState (tasks) НЕ изменился
   *    → optimisticTasks автоматически откатывается к tasks
   * 5. Удалённая задача "возвращается" в список
   */
  function handleDeleteTask(taskId: number) {
    setDeleteError(null);

    startDeleteTransition(async () => {
      // 1. Мгновенно убираем задачу из UI
      removeOptimisticTask(taskId);

      // 2. Имитация запроса на сервер
      await delay(1500);

      if (serverFails) {
        // 3. Сервер "упал" — НЕ обновляем реальное состояние.
        //    React увидит, что tasks не изменились,
        //    и откатит optimisticTasks обратно к tasks.
        //    Задача вернётся в список автоматически.
        setDeleteError('Сервер вернул ошибку 500. Задача восстановлена автоматически.');
        return;
      }

      // 4. Успех — обновляем реальное состояние
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
    });
  }

  return (
    <div>
      <div className="page-header">
        <span className="page-tag new">React 19</span>
        <h2>useOptimistic</h2>
        <p>
          Мгновенное обновление UI до ответа сервера.
          Автооткат при ошибке.
        </p>
      </div>

      <div className="info-box info">
        <code>useOptimistic(realState, updateFn)</code> — показывает
        оптимистичное значение пока запрос выполняется, и автоматически
        откатывается к <code>realState</code> при ошибке.
      </div>

      {/* Демо 1: Чат */}
      <div className="demo-section">
        <h3>Пример 1: Чат с оптимистичной отправкой</h3>
        <p className="card-description">
          Сообщение появляется мгновенно (полупрозрачное). После ответа сервера
          становится обычным. При ошибке — исчезает.
        </p>

        {/* Список сообщений */}
        <div className="messages-list">
          {optimisticMessages.map((msg) => (
            <div
              key={msg.id}
              className={`message-item ${msg.sending ? 'sending' : ''}`}
            >
              <div className="message-author">{msg.author}</div>
              <div className="message-text">
                {msg.text}
                {/* Показываем индикатор отправки */}
                {msg.sending && (
                  <span style={{ color: 'var(--warning)', fontSize: '12px' }}>
                    {' '}(отправка...)
                  </span>
                )}
              </div>
              <div className="message-time">
                {new Date(msg.timestamp).toLocaleTimeString('ru-RU')}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Форма отправки */}
        <form action={handleSendMessage} className="flex gap-2">
          <input
            name="message"
            className="form-input"
            placeholder="Введите сообщение..."
            autoComplete="off"
          />
          <button type="submit" className="btn btn-primary">
            Отправить
          </button>
        </form>

        {/* Ошибка отправки */}
        {error && (
          <div className="info-box error mt-3">
            {error} (сообщение автоматически откатилось)
          </div>
        )}
      </div>

      {/* Демо 2: Лайки */}
      <div className="demo-section">
        <h3>Пример 2: Оптимистичные лайки</h3>
        <p className="card-description">
          Нажмите на сердечко — лайк переключится мгновенно.
          Запрос на сервер идёт 1 секунду.
        </p>

        {optimisticItems.map((item) => (
          <div key={item.id} className="todo-item" style={{ cursor: 'default' }}>
            <div style={{ flex: 1 }}>
              <strong>{item.title}</strong>
            </div>
            <button
              className="btn btn-sm btn-outline"
              onClick={() => handleToggleLike(item.id)}
              disabled={isLikePending}
              style={{
                color: item.liked ? 'var(--error)' : 'var(--text-muted)',
                borderColor: item.liked ? 'var(--error)' : 'var(--border)',
                fontSize: '16px',
              }}
            >
              {item.liked ? '\u2764' : '\u2661'} {item.likes}
            </button>
          </div>
        ))}
      </div>

      {/* Демо 3: Удаление с откатом при ошибке */}
      <div className="demo-section">
        <h3>Пример 3: Удаление задач (откат при ошибке)</h3>
        <p className="card-description">
          Удалите задачу — она исчезнет мгновенно. Если сервер "упадёт",
          задача автоматически вернётся. Включите переключатель, чтобы имитировать сбой.
        </p>

        {/* Переключатель режима ошибки */}
        <div style={{ marginBottom: '12px' }}>
          <label
            className="form-checkbox"
            style={{
              color: serverFails ? 'var(--error)' : 'var(--text-secondary)',
              fontWeight: serverFails ? 600 : 400,
            }}
          >
            <input
              type="checkbox"
              checked={serverFails}
              onChange={(e) => {
                setServerFails(e.target.checked);
                setDeleteError(null);
              }}
            />
            Сервер падает (имитация ошибки 500)
          </label>
        </div>

        {/* Список задач */}
        {optimisticTasks.length === 0 ? (
          <div className="info-box info">
            Все задачи удалены.{' '}
            <button
              className="btn btn-sm btn-outline"
              onClick={() => {
                setTasks(INITIAL_TASKS);
                setDeleteError(null);
              }}
            >
              Восстановить
            </button>
          </div>
        ) : (
          optimisticTasks.map((task) => (
            <div key={task.id} className="todo-item">
              <span>{task.text}</span>
              <button
                className="btn btn-sm btn-danger"
                onClick={() => handleDeleteTask(task.id)}
                disabled={isDeletePending}
              >
                Удалить
              </button>
            </div>
          ))
        )}

        {/* Ошибка удаления */}
        {deleteError && (
          <div className="info-box error mt-3">
            {deleteError}
          </div>
        )}

        {/* Пояснение механики */}
        <div className="info-box info mt-3" style={{ fontSize: '13px' }}>
          <strong>Как работает откат:</strong><br />
          1. <code>removeOptimisticTask(id)</code> — задача мгновенно исчезает из UI<br />
          2. Запрос на сервер (1.5с)<br />
          3a. Успех → <code>setTasks()</code> обновляет реальное состояние → задача остаётся удалённой<br />
          3b. Ошибка → <code>setTasks()</code> НЕ вызывается → React видит, что <code>tasks</code> не изменился →
          откатывает <code>optimisticTasks</code> обратно к <code>tasks</code> → задача возвращается
        </div>
      </div>

      <div className="info-box warning">
        <strong>Когда использовать:</strong> когда действие имеет высокий шанс успеха
        (лайки, отправка сообщений, переключение статуса). Не подходит для действий
        с частыми ошибками — пользователь увидит "мигание" UI.
      </div>
    </div>
  );
}
