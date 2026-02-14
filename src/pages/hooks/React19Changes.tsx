/**
 * React19Changes — обзор изменений в React 19
 *
 * Ключевые изменения:
 * 1. ref как пропс — не нужен forwardRef
 * 2. <Context> вместо <Context.Provider>
 * 3. Cleanup-функция в ref callback
 * 4. React Compiler (React Forget) — автоматическая мемоизация
 * 5. Улучшенное отображение ошибок
 */

import { useState, useRef, createContext, useContext } from 'react';

// ===== Пример 1: ref как пропс (без forwardRef) =====

/**
 * В React 18 для передачи ref в дочерний компонент
 * нужно было оборачивать его в forwardRef:
 *
 * const MyInput = forwardRef<HTMLInputElement, Props>((props, ref) => {
 *   return <input ref={ref} {...props} />;
 * });
 *
 * В React 19 ref — это ОБЫЧНЫЙ пропс!
 * forwardRef больше не нужен.
 */
function CustomInput({
  ref,
  label,
  ...props
}: {
  ref?: React.Ref<HTMLInputElement>; // ref теперь обычный пропс
  label: string;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="form-group">
      <label>{label}</label>
      {/* ref передаётся напрямую — без forwardRef */}
      <input ref={ref} className="form-input" {...props} />
    </div>
  );
}

// ===== Пример 2: Context без Provider =====

/**
 * React 19: можно использовать <Context value={...}> напрямую
 * вместо <Context.Provider value={...}>
 *
 * <Context.Provider> будет deprecated в будущих версиях.
 */
const UserContext = createContext<{ name: string; role: string }>({
  name: 'Гость',
  role: 'viewer',
});

function UserInfo() {
  const user = useContext(UserContext);
  return (
    <div className="card">
      <div className="card-title">{user.name}</div>
      <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
        Роль: {user.role}
      </p>
    </div>
  );
}

// ===== Пример 3: Cleanup в ref callback =====

/**
 * React 19: ref callback может возвращать cleanup-функцию.
 *
 * До React 19: ref callback вызывался с null при размонтировании.
 * После React 19: можно вернуть функцию очистки (как в useEffect).
 *
 * Это полезно для:
 * - Отписки от IntersectionObserver
 * - Удаления event listener
 * - Очистки canvas
 */
function MeasuredBox() {
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  /**
   * ref callback — вызывается когда элемент монтируется.
   * Возвращаемая функция — вызывается при размонтировании (cleanup).
   */
  const measuredRef = (node: HTMLDivElement | null) => {
    if (!node) return;

    // Устанавливаем observer при монтировании
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setDimensions({
          width: Math.round(entry.contentRect.width),
          height: Math.round(entry.contentRect.height),
        });
      }
    });

    observer.observe(node);

    // React 19: cleanup-функция — вызывается при размонтировании
    // Аналог return () => ... в useEffect
    return () => {
      observer.disconnect();
    };
  };

  return (
    <div>
      <div
        ref={measuredRef}
        style={{
          padding: '20px',
          background: 'var(--bg-primary)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
          resize: 'both', // Можно менять размер мышкой
          overflow: 'auto',
          minWidth: '200px',
          minHeight: '80px',
        }}
      >
        Измените размер этого блока (перетяните правый нижний угол)
      </div>
      <div
        style={{
          fontSize: '13px',
          color: 'var(--text-secondary)',
          marginTop: '8px',
        }}
      >
        Размер: {dimensions.width}px x {dimensions.height}px
      </div>
    </div>
  );
}

// ===== Главный компонент =====

export default function React19Changes() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [currentUser, setCurrentUser] = useState({
    name: 'Алексей',
    role: 'developer',
  });

  return (
    <div>
      <div className="page-header">
        <span className="page-tag new">React 19</span>
        <h2>Изменения в React 19</h2>
        <p>
          ref как пропс, Context без Provider, cleanup в ref callback,
          React Compiler.
        </p>
      </div>

      {/* 1. ref как пропс */}
      <div className="demo-section">
        <h3>1. ref как пропс (без forwardRef)</h3>
        <p className="card-description">
          В React 19 ref передаётся как обычный пропс.
          forwardRef больше не нужен.
        </p>

        <div className="info-box info">
          <strong>React 18:</strong> <code>forwardRef((props, ref) =&gt; ...)</code>
          <br />
          <strong>React 19:</strong> <code>{'function MyComponent({ ref, ...props })'}</code>
          <br />
          <code>forwardRef</code> будет deprecated в будущих версиях.
        </div>

        <CustomInput
          ref={inputRef}
          label="Поле с ref (кнопка ниже ставит фокус)"
          placeholder="Кликните кнопку для фокуса"
        />

        <button
          className="btn btn-primary btn-sm"
          onClick={() => inputRef.current?.focus()}
        >
          Фокус на поле (через ref)
        </button>
      </div>

      {/* 2. Context без Provider */}
      <div className="demo-section">
        <h3>2. Context без Provider</h3>
        <p className="card-description">
          React 19 позволяет использовать <code>&lt;Context value=&#123;...&#125;&gt;</code>{' '}
          вместо <code>&lt;Context.Provider value=&#123;...&#125;&gt;</code>.
        </p>

        <div className="info-box info">
          <strong>React 18:</strong>{' '}
          <code>&lt;UserContext.Provider value=&#123;user&#125;&gt;</code>
          <br />
          <strong>React 19:</strong>{' '}
          <code>&lt;UserContext value=&#123;user&#125;&gt;</code>
        </div>

        <div className="flex gap-2 mb-3">
          <button
            className="btn btn-secondary btn-sm"
            onClick={() =>
              setCurrentUser({ name: 'Алексей', role: 'developer' })
            }
          >
            Developer
          </button>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() =>
              setCurrentUser({ name: 'Мария', role: 'designer' })
            }
          >
            Designer
          </button>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() =>
              setCurrentUser({ name: 'Дмитрий', role: 'manager' })
            }
          >
            Manager
          </button>
        </div>

        {/* React 19: <UserContext value={...}> без .Provider */}
        <UserContext value={currentUser}>
          <UserInfo />
        </UserContext>
      </div>

      {/* 3. Cleanup в ref callback */}
      <div className="demo-section">
        <h3>3. Cleanup в ref callback</h3>
        <p className="card-description">
          React 19: ref callback может возвращать функцию очистки (как useEffect).
          Полезно для IntersectionObserver, ResizeObserver, event listeners.
        </p>

        <div className="info-box info">
          <strong>React 18:</strong> ref callback вызывается с <code>null</code> при
          размонтировании.
          <br />
          <strong>React 19:</strong> ref callback может вернуть{' '}
          <code>() =&gt; cleanup()</code> — аналог useEffect cleanup.
        </div>

        <MeasuredBox />
      </div>

      {/* 4. React Compiler */}
      <div className="demo-section">
        <h3>4. React Compiler (React Forget)</h3>
        <p className="card-description">
          Автоматическая мемоизация. Компилятор сам определяет, что нужно мемоизировать.
        </p>

        <div className="info-box warning">
          <strong>Статус:</strong> React Compiler в бета-версии. Пока не рекомендуется
          для production. Но когда выйдет — <code>useMemo</code> и{' '}
          <code>useCallback</code> станут избыточными в большинстве случаев.
        </div>

        <table className="comparison-table">
          <thead>
            <tr>
              <th>До (ручная мемоизация)</th>
              <th>После (с Compiler)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <code>useMemo(() =&gt; compute(), [deps])</code>
              </td>
              <td>
                <code>compute()</code> — Compiler сам решит
              </td>
            </tr>
            <tr>
              <td>
                <code>useCallback(fn, [deps])</code>
              </td>
              <td>
                <code>fn</code> — Compiler оптимизирует
              </td>
            </tr>
            <tr>
              <td>
                <code>React.memo(Component)</code>
              </td>
              <td>Не нужно — Compiler сам решит
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* 5. Другие изменения */}
      <div className="demo-section">
        <h3>5. Другие изменения React 19</h3>

        <table className="comparison-table">
          <thead>
            <tr>
              <th>Что изменилось</th>
              <th>React 18</th>
              <th>React 19</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>ref в функциональных компонентах</td>
              <td><code>forwardRef</code></td>
              <td>Обычный пропс</td>
            </tr>
            <tr>
              <td>Context Provider</td>
              <td><code>&lt;Ctx.Provider&gt;</code></td>
              <td><code>&lt;Ctx&gt;</code></td>
            </tr>
            <tr>
              <td>Документ &lt;title&gt;</td>
              <td>react-helmet</td>
              <td><code>&lt;title&gt;</code> в компоненте</td>
            </tr>
            <tr>
              <td>Стили</td>
              <td>Ручное управление</td>
              <td><code>&lt;link&gt;</code> с приоритетом</td>
            </tr>
            <tr>
              <td>Form action</td>
              <td><code>onSubmit</code></td>
              <td><code>action={'{fn}'}</code></td>
            </tr>
            <tr>
              <td>Ошибки гидратации</td>
              <td>Непонятные</td>
              <td>Diff с подробностями</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
