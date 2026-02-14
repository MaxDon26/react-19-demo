/**
 * UseActionStateDemo — демонстрация useActionState из React 19
 *
 * useActionState — хук для управления состоянием серверных action.
 * Заменяет паттерн: useState(result) + useState(isPending) + handleSubmit
 *
 * Сигнатура:
 *   const [state, formAction, isPending] = useActionState(actionFn, initialState)
 *
 * Где:
 * - actionFn(previousState, formData) — функция action
 * - initialState — начальное значение state
 *
 * Возвращает:
 * - state — последний результат action (или initialState)
 * - formAction — функция для <form action={formAction}>
 * - isPending — boolean, выполняется ли action прямо сейчас
 */

import { useActionState } from 'react';
import { delay } from '../../utils/api';

// ===== Типы =====

/** Состояние action для формы обратной связи */
interface FeedbackState {
  status: 'idle' | 'success' | 'error';
  message: string;
  data?: {
    name: string;
    email: string;
    feedback: string;
  };
}

/** Состояние action для формы подписки */
interface SubscribeState {
  status: 'idle' | 'success' | 'error';
  message: string;
}

// ===== Action-функции =====

/**
 * submitFeedback — action для формы обратной связи.
 *
 * Ключевые моменты:
 * 1. Первый аргумент — ПРЕДЫДУЩЕЕ состояние (не formData!)
 * 2. Второй аргумент — FormData из формы
 * 3. Возвращает НОВОЕ состояние (то, что попадёт в state)
 * 4. Может быть async — isPending автоматически отслеживается
 */
async function submitFeedback(
  _previousState: FeedbackState, // предыдущее состояние (можно использовать для логики)
  formData: FormData
): Promise<FeedbackState> {
  // Извлекаем данные из FormData
  const name = formData.get('name') as string;
  const email = formData.get('email') as string;
  const feedback = formData.get('feedback') as string;

  // Валидация
  if (!name || !email || !feedback) {
    return {
      status: 'error',
      message: 'Все поля обязательны для заполнения',
    };
  }

  if (!email.includes('@')) {
    return {
      status: 'error',
      message: 'Введите корректный email',
    };
  }

  // Имитация отправки на сервер
  await delay(1500);

  // Имитация ошибки сервера (10% шанс)
  if (Math.random() < 0.1) {
    return {
      status: 'error',
      message: 'Ошибка сервера. Попробуйте ещё раз.',
    };
  }

  return {
    status: 'success',
    message: `Спасибо, ${name}! Ваш отзыв получен.`,
    data: { name, email, feedback },
  };
}

/**
 * handleSubscribe — простой action для подписки на рассылку
 */
async function handleSubscribe(
  _prevState: SubscribeState,
  formData: FormData
): Promise<SubscribeState> {
  const email = formData.get('email') as string;

  if (!email || !email.includes('@')) {
    return { status: 'error', message: 'Введите корректный email' };
  }

  await delay(1000);

  return { status: 'success', message: `${email} подписан на рассылку!` };
}

// ===== Главный компонент =====

export default function UseActionStateDemo() {
  /**
   * useActionState возвращает тройку:
   *
   * feedbackState — текущее состояние (результат последнего вызова action)
   * feedbackAction — функция для передачи в <form action={...}>
   * isFeedbackPending — true пока action выполняется (async)
   *
   * При сабмите формы React автоматически:
   * 1. Устанавливает isPending = true
   * 2. Собирает FormData из формы
   * 3. Вызывает action(previousState, formData)
   * 4. Записывает результат в state
   * 5. Устанавливает isPending = false
   */
  const [feedbackState, feedbackAction, isFeedbackPending] = useActionState(
    submitFeedback,
    { status: 'idle', message: '' } as FeedbackState
  );

  const [subscribeState, subscribeFormAction, isSubscribePending] = useActionState(
    handleSubscribe,
    { status: 'idle', message: '' } as SubscribeState
  );

  return (
    <div>
      <div className="page-header">
        <span className="page-tag new">React 19</span>
        <h2>useActionState</h2>
        <p>
          Управление состоянием action-функций. Автоматический isPending,
          обработка результатов и ошибок.
        </p>
      </div>

      <div className="info-box info">
        <code>useActionState(actionFn, initialState)</code> заменяет три useState:{' '}
        <code>result</code>, <code>error</code>, <code>isPending</code>.
        Action-функция получает <code>(prevState, formData)</code>.
      </div>

      {/* Демо 1: Форма обратной связи */}
      <div className="demo-section">
        <h3>Пример 1: Форма обратной связи</h3>
        <p className="card-description">
          Полная форма с валидацией, обработкой ошибок и состоянием загрузки.
          Вся логика — в action-функции submitFeedback.
        </p>

        {/*
          <form action={feedbackAction}> — ключевая фича React 19.
          При submit React:
          1. Предотвращает стандартный submit (не нужен e.preventDefault)
          2. Собирает FormData из всех полей с атрибутом name
          3. Вызывает feedbackAction(previousState, formData)
        */}
        <form action={feedbackAction}>
          <div className="form-group">
            <label htmlFor="feedback-name">Имя</label>
            <input
              id="feedback-name"
              name="name" // ВАЖНО: атрибут name — по нему FormData.get('name')
              className="form-input"
              placeholder="Ваше имя"
              disabled={isFeedbackPending}
            />
          </div>

          <div className="form-group">
            <label htmlFor="feedback-email">Email</label>
            <input
              id="feedback-email"
              name="email"
              type="email"
              className="form-input"
              placeholder="email@example.com"
              disabled={isFeedbackPending}
            />
          </div>

          <div className="form-group">
            <label htmlFor="feedback-text">Отзыв</label>
            <textarea
              id="feedback-text"
              name="feedback"
              className="form-textarea"
              placeholder="Ваш отзыв..."
              disabled={isFeedbackPending}
            />
          </div>

          {/* isPending автоматически true пока action выполняется */}
          <button
            type="submit"
            className="btn btn-primary"
            disabled={isFeedbackPending}
          >
            {isFeedbackPending ? (
              <>
                <span className="spinner" /> Отправка...
              </>
            ) : (
              'Отправить отзыв'
            )}
          </button>
        </form>

        {/* Показываем результат action */}
        {feedbackState.status !== 'idle' && (
          <div
            className={`info-box mt-3 ${feedbackState.status === 'success' ? 'success' : 'error'}`}
          >
            {feedbackState.message}
          </div>
        )}

        {/* Показываем отправленные данные при успехе */}
        {feedbackState.data && (
          <div className="demo-result mt-2">
            <pre>{JSON.stringify(feedbackState.data, null, 2)}</pre>
          </div>
        )}
      </div>

      {/* Демо 2: Простая подписка */}
      <div className="demo-section">
        <h3>Пример 2: Подписка на рассылку (минимальный пример)</h3>
        <p className="card-description">
          Самый простой пример useActionState — одно поле, один action.
        </p>

        <form action={subscribeFormAction} className="flex gap-2">
          <input
            name="email"
            type="email"
            className="form-input"
            placeholder="Ваш email"
            disabled={isSubscribePending}
            style={{ maxWidth: '300px' }}
          />
          <button
            type="submit"
            className="btn btn-primary"
            disabled={isSubscribePending}
          >
            {isSubscribePending ? (
              <span className="spinner" />
            ) : (
              'Подписаться'
            )}
          </button>
        </form>

        {subscribeState.status !== 'idle' && (
          <div
            className={`info-box mt-3 ${subscribeState.status === 'success' ? 'success' : 'error'}`}
          >
            {subscribeState.message}
          </div>
        )}
      </div>

      {/* Подсказки */}
      <div className="info-box warning">
        <strong>Порядок аргументов:</strong> action получает{' '}
        <code>(previousState, formData)</code> — НЕ (formData, previousState).
        Это частая ошибка.
      </div>
    </div>
  );
}
