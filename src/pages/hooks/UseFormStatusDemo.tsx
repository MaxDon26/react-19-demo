/**
 * UseFormStatusDemo — демонстрация useFormStatus из react-dom
 *
 * useFormStatus — хук, который даёт информацию о статусе
 * РОДИТЕЛЬСКОЙ формы из ДОЧЕРНЕГО компонента.
 *
 * КРИТИЧЕСКИ ВАЖНО:
 * - useFormStatus работает ТОЛЬКО внутри <form>, у которой задан action
 * - Компонент с useFormStatus должен быть ДОЧЕРНИМ элементом <form>
 * - Если вызвать вне формы — pending всегда false
 *
 * Возвращает объект:
 * - pending: boolean — идёт ли отправка
 * - data: FormData | null — данные формы при отправке
 * - method: string — HTTP метод (get/post)
 * - action: Function — ссылка на action-функцию
 *
 * Главное применение: переиспользуемые кнопки отправки,
 * индикаторы загрузки, блокировка полей во время отправки.
 */

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { delay } from '../../utils/api';

// ===== Переиспользуемые компоненты с useFormStatus =====

/**
 * SubmitButton — универсальная кнопка отправки.
 *
 * Не нужно пробрасывать isPending через пропсы!
 * useFormStatus автоматически "подключается" к ближайшему <form>.
 *
 * Можно переиспользовать в ЛЮБОЙ форме — кнопка сама знает,
 * отправляется ли форма.
 */
function SubmitButton({ children }: { children: React.ReactNode }) {
  // pending = true когда action формы выполняется
  const { pending } = useFormStatus();

  return (
    <button type="submit" className="btn btn-primary" disabled={pending}>
      {pending ? (
        <>
          <span className="spinner" /> Отправка...
        </>
      ) : (
        children
      )}
    </button>
  );
}

/**
 * FormFields — поля формы, которые блокируются при отправке.
 *
 * useFormStatus позволяет НЕ пробрасывать disabled через каждый пропс.
 * Поля сами узнают статус отправки.
 */
function FormFields() {
  const { pending } = useFormStatus();

  return (
    <>
      <div className="form-group">
        <label>Имя</label>
        <input
          name="name"
          className="form-input"
          placeholder="Ваше имя"
          disabled={pending}
          required
        />
      </div>
      <div className="form-group">
        <label>Email</label>
        <input
          name="email"
          type="email"
          className="form-input"
          placeholder="email@example.com"
          disabled={pending}
          required
        />
      </div>
      <div className="form-group">
        <label>Сообщение</label>
        <textarea
          name="message"
          className="form-textarea"
          placeholder="Ваше сообщение..."
          disabled={pending}
          required
        />
      </div>
    </>
  );
}

/**
 * FormStatusDisplay — отображение полного статуса формы.
 *
 * Показывает ВСЕ поля, которые возвращает useFormStatus:
 * pending, data, method, action
 */
function FormStatusDisplay() {
  const status = useFormStatus();

  return (
    <div className="demo-result mt-3">
      <pre>
        {JSON.stringify(
          {
            pending: status.pending,
            // FormData нельзя напрямую сериализовать — конвертируем
            data: status.data
              ? Object.fromEntries(status.data.entries())
              : null,
            method: status.method,
            action: status.action ? '[Function]' : null,
          },
          null,
          2
        )}
      </pre>
    </div>
  );
}

/**
 * StatusBadge — индикатор статуса формы.
 *
 * Показывает визуальный бейдж с текущим состоянием.
 */
function StatusBadge() {
  const { pending } = useFormStatus();

  return (
    <div className="flex items-center gap-2 mb-3">
      <span className={`status-dot ${pending ? 'pending' : 'success'}`} />
      <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
        {pending ? 'Отправляется...' : 'Готова к отправке'}
      </span>
    </div>
  );
}

// ===== Action-функции =====

interface ContactState {
  status: 'idle' | 'success' | 'error';
  message: string;
}

async function contactAction(
  _prev: ContactState,
  formData: FormData
): Promise<ContactState> {
  const name = formData.get('name') as string;
  await delay(2000); // Долгая задержка для наглядности

  return {
    status: 'success',
    message: `Сообщение от ${name} отправлено!`,
  };
}

interface SimpleState {
  status: 'idle' | 'success';
  message: string;
}

async function simpleAction(
  _prev: SimpleState,
  formData: FormData
): Promise<SimpleState> {
  const query = formData.get('query') as string;
  await delay(1500);
  return { status: 'success', message: `Поиск: "${query}" выполнен` };
}

// ===== Главный компонент =====

export default function UseFormStatusDemo() {
  const [contactState, contactFormAction] = useActionState(contactAction, {
    status: 'idle',
    message: '',
  } as ContactState);

  const [simpleState, simpleFormAction] = useActionState(simpleAction, {
    status: 'idle',
    message: '',
  } as SimpleState);

  return (
    <div>
      <div className="page-header">
        <span className="page-tag new">React 19</span>
        <h2>useFormStatus</h2>
        <p>
          Получение статуса формы в дочерних компонентах без prop drilling.
          Переиспользуемые кнопки и индикаторы.
        </p>
      </div>

      <div className="info-box info">
        <code>useFormStatus()</code> возвращает <code>{'{ pending, data, method, action }'}</code>.
        Работает ТОЛЬКО внутри <code>&lt;form&gt;</code> с <code>action</code>.
        Компонент должен быть потомком формы.
      </div>

      <div className="info-box warning">
        <strong>Частая ошибка:</strong> вызвать useFormStatus в том же компоненте,
        где определена форма. Это НЕ сработает! useFormStatus читает статус
        РОДИТЕЛЬСКОЙ формы. Нужен отдельный дочерний компонент.
      </div>

      {/* Демо 1: Переиспользуемые компоненты */}
      <div className="demo-section">
        <h3>Пример 1: Форма контакта (переиспользуемые компоненты)</h3>
        <p className="card-description">
          SubmitButton, FormFields и StatusBadge — все используют useFormStatus.
          Ни одному из них не нужно передавать isPending через пропсы.
        </p>

        <form action={contactFormAction}>
          {/*
            Все три компонента ниже используют useFormStatus
            и автоматически реагируют на отправку формы.
            Никакого prop drilling!
          */}
          <StatusBadge />
          <FormFields />
          <SubmitButton>Отправить сообщение</SubmitButton>
          <FormStatusDisplay />
        </form>

        {contactState.status !== 'idle' && (
          <div className={`info-box mt-3 ${contactState.status}`}>
            {contactState.message}
          </div>
        )}
      </div>

      {/* Демо 2: Простая форма поиска */}
      <div className="demo-section">
        <h3>Пример 2: Поиск (та же SubmitButton в другой форме)</h3>
        <p className="card-description">
          Тот же компонент SubmitButton переиспользован в другой форме.
          Он автоматически привязывается к ближайшему &lt;form&gt;.
        </p>

        <form action={simpleFormAction} className="flex gap-2">
          <input
            name="query"
            className="form-input"
            placeholder="Поисковый запрос..."
            style={{ maxWidth: '300px' }}
          />
          {/* Та же самая SubmitButton — работает в любой форме */}
          <SubmitButton>Найти</SubmitButton>
        </form>

        {simpleState.status !== 'idle' && (
          <div className="info-box success mt-3">{simpleState.message}</div>
        )}
      </div>
    </div>
  );
}
