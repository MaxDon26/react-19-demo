/**
 * UseDemo — демонстрация хука use() из React 19
 *
 * use() — это новый API React 19, НЕ хук в классическом смысле.
 * Главное отличие от обычных хуков:
 *   - Можно вызывать внутри if, for, ранних return
 *   - Работает с Promise (интеграция с Suspense)
 *   - Работает с Context (замена useContext, но гибче)
 *
 * ВАЖНО: Promise, переданный в use(), должен быть СТАБИЛЬНЫМ.
 * Нельзя создавать Promise при каждом рендере — это вызовет бесконечный цикл.
 */

import { use, Suspense, useState, useMemo, createContext } from "react";
import { fetchUser, fetchUsers, type User } from "../../utils/api";

// ===== Пример 1: use() с Promise =====

/**
 * Создаём Promise ЗАРАНЕЕ (вне компонента или через useMemo/useState).
 * Если создать fetchUsers() прямо в рендере — при каждом рендере
 * будет новый Promise, и React будет Suspend бесконечно.
 */
const usersPromise = fetchUsers();

/**
 * UserList — компонент, который "приостанавливается" (suspend)
 * пока Promise не зарезолвится.
 *
 * Как это работает:
 * 1. React начинает рендерить UserList
 * 2. use(usersPromise) видит, что Promise pending → бросает исключение
 * 3. Ближайший <Suspense> ловит его и показывает fallback
 * 4. Когда Promise резолвится → React перерендерит UserList с данными
 */
function UserList({ promise }: { promise: Promise<User[]> }) {
  // use() "приостанавливает" компонент до получения данных
  // Это заменяет паттерн: useEffect + useState + loading state
  const users = use(promise);

  return (
    <ul style={{ listStyle: "none", padding: 0 }}>
      {users.map((user) => (
        <li key={user.id} className="todo-item">
          <div>
            <strong>{user.name}</strong>
            <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>
              {user.email} | {user.role}
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}

// ===== Пример 2: use() с Context =====

/**
 * Создаём контекст темы.
 * В React 19 можно использовать use(ThemeContext) вместо useContext(ThemeContext).
 * Преимущество: use() можно вызывать в условиях!
 */
const ThemeContext = createContext<"light" | "dark">("dark");

/**
 * ThemedCard — демо use() с Context внутри условия.
 *
 * С useContext так НЕЛЬЗЯ — хуки нельзя вызывать в условиях.
 * С use() — МОЖНО, потому что use() не является хуком.
 */
function ThemedCard({ showTheme }: { showTheme: boolean }) {
  // use() с Context можно вызывать условно — это НЕ хук!
  // useContext() в условии вызвал бы ошибку React
  if (showTheme) {
    const theme = use(ThemeContext);
    return (
      <div
        className="card"
        style={{
          background: theme === "dark" ? "var(--bg-card)" : "#f8fafc",
          color: theme === "dark" ? "var(--text-primary)" : "#0f172a",
        }}
      >
        <div className="card-title">Тема: {theme}</div>
        <p style={{ fontSize: "14px", color: theme === "dark" ? "var(--text-secondary)" : "#475569" }}>
          use(ThemeContext) вызван внутри if — это валидный код в React 19. С useContext так нельзя!
        </p>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card-title">Тема скрыта</div>
      <p style={{ fontSize: "14px", color: "var(--text-secondary)" }}>
        use(ThemeContext) НЕ вызывается, когда showTheme = false. Это невозможно с useContext — он обязан вызываться при
        каждом рендере.
      </p>
    </div>
  );
}

// ===== Пример 3: use() с динамическим Promise =====

function SingleUser({ promise }: { promise: Promise<User> }) {
  const user = use(promise);
  return (
    <div className="card">
      <div className="card-title">{user.name}</div>
      <p style={{ fontSize: "14px", color: "var(--text-secondary)" }}>
        {user.email} | Роль: {user.role}
      </p>
    </div>
  );
}

// ===== Главный компонент страницы =====

export default function UseDemo() {
  const [showTheme, setShowTheme] = useState(true);
  const [theme, setTheme] = useState<"light" | "dark">("dark");

  // Для динамической загрузки пользователя
  const [userId, setUserId] = useState(1);

  /**
   * useMemo кеширует Promise между рендерами.
   * Новый Promise создаётся ТОЛЬКО при смене userId.
   *
   * Почему useMemo, а не useState:
   * - useState требует отдельный setter (setUserPromise) → 2 setState при смене юзера
   * - useMemo автоматически пересоздаёт промис при изменении зависимости [userId]
   * - Код проще: один setUserId(id) вместо setUserId(id) + setUserPromise(fetchUser(id))
   *
   * ВАЖНО: без useMemo/useState промис создавался бы при КАЖДОМ рендере,
   * и use() бесконечно suspend'ил бы компонент.
   */
  const userPromise = useMemo(() => fetchUser(userId), [userId]);

  return (
    <div>
      <div className="page-header">
        <span className="page-tag new">React 19</span>
        <h2>use() — чтение ресурсов в рендере</h2>
        <p>
          Новый API, который заменяет useEffect + useState для загрузки данных и расширяет useContext возможностью
          условного вызова.
        </p>
      </div>

      {/* Информационный блок */}
      <div className="info-box info">
        <strong>use() — это НЕ хук!</strong> Его можно вызывать в <code>if</code>, <code>for</code>, ранних{" "}
        <code>return</code>. Работает с Promise (через Suspense) и Context.
      </div>

      {/* Демо 1: use() с Promise */}
      <div className="demo-section">
        <h3>Пример 1: use() с Promise + Suspense</h3>
        <p className="card-description">
          Список пользователей загружается через use(promise). Пока данные загружаются, Suspense показывает fallback.
        </p>

        {/*
          Suspense оборачивает компонент, использующий use(promise).
          fallback показывается пока Promise в состоянии pending.
        */}
        <Suspense
          fallback={
            <div className="loading-state">
              <span className="spinner" />
              Загрузка пользователей...
            </div>
          }
        >
          <UserList promise={usersPromise} />
        </Suspense>
      </div>

      {/* Демо 2: use() с Context (условный вызов) */}
      <div className="demo-section">
        <h3>Пример 2: use() с Context (условный вызов)</h3>
        <p className="card-description">
          use(Context) можно вызывать внутри if — в отличие от useContext. Переключите показ темы и саму тему.
        </p>

        <div className="flex gap-2 mb-3">
          <button className="btn btn-secondary btn-sm" onClick={() => setShowTheme(!showTheme)}>
            {showTheme ? "Скрыть тему" : "Показать тему"}
          </button>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
          >
            Тема: {theme}
          </button>
        </div>

        {/*
          ThemeContext — провайдер контекста.
          React 19: можно писать <ThemeContext value={...}> вместо
          <ThemeContext.Provider value={...}>
        */}
        <ThemeContext value={theme}>
          <ThemedCard showTheme={showTheme} />
        </ThemeContext>
      </div>

      {/* Демо 3: use() с динамическим Promise */}
      <div className="demo-section">
        <h3>Пример 3: Динамическая загрузка (выбор пользователя)</h3>
        <p className="card-description">
          При смене ID useMemo создаёт новый Promise. Suspense автоматически показывает fallback при загрузке.
        </p>

        <div className="flex gap-2 mb-3">
          {[1, 2, 3].map((id) => (
            <button
              key={id}
              className={`btn btn-sm ${userId === id ? "btn-primary" : "btn-outline"}`}
              onClick={() => setUserId(id)}
            >
              User #{id}
            </button>
          ))}
        </div>

        <Suspense
          fallback={
            <div className="loading-state">
              <span className="spinner" />
              Загрузка пользователя #{userId}...
            </div>
          }
        >
          <SingleUser promise={userPromise} />
        </Suspense>
      </div>

      {/* Подсказки */}
      <div className="info-box warning">
        <strong>Частая ошибка:</strong> создание Promise при каждом рендере. <code>use(fetchData())</code> —
        НЕПРАВИЛЬНО. Promise нужно кешировать через useState, useMemo или передавать из родителя.
      </div>
    </div>
  );
}
