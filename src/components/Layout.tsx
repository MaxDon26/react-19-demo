/**
 * Layout — главный каркас приложения
 *
 * Содержит:
 * - Sidebar с навигацией (фиксированный слева)
 * - Основную область контента (справа от sidebar)
 *
 * Использует NavLink из react-router-dom для автоматического
 * добавления класса "active" к текущей ссылке
 */

import { NavLink, Outlet } from 'react-router-dom';

export default function Layout() {
  return (
    <div className="app-layout">
      {/* ===== Sidebar — фиксированная навигация ===== */}
      <aside className="sidebar">
        {/* Логотип */}
        <div className="sidebar-logo">
          <h1>React 19 Lab</h1>
          <span>Интерактивное демо</span>
        </div>

        {/* Навигация: Главная */}
        <nav className="nav-section">
          <NavLink to="/" end className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            # Карта проектов
          </NavLink>
        </nav>

        {/* Навигация: Новые хуки React 19 */}
        <nav className="nav-section">
          <div className="nav-section-title">Новые хуки React 19</div>

          <NavLink to="/hooks/use" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            use()
            <span className="badge">NEW</span>
          </NavLink>

          <NavLink to="/hooks/use-action-state" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            useActionState
            <span className="badge">NEW</span>
          </NavLink>

          <NavLink to="/hooks/use-form-status" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            useFormStatus
            <span className="badge">NEW</span>
          </NavLink>

          <NavLink to="/hooks/use-optimistic" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            useOptimistic
            <span className="badge">NEW</span>
          </NavLink>

          <NavLink to="/hooks/use-transition" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            useTransition
          </NavLink>

          <NavLink to="/hooks/react19-changes" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            Изменения в React 19
          </NavLink>
        </nav>

        {/* Навигация: Формы и валидация */}
        <nav className="nav-section">
          <div className="nav-section-title">Формы и валидация</div>

          <NavLink to="/forms/events" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            События форм
          </NavLink>

          <NavLink to="/forms/vanilla" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            Vanilla-валидация
          </NavLink>

          <NavLink to="/forms/yup" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            Yup
          </NavLink>

          <NavLink to="/forms/zod" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            Zod
          </NavLink>

          <NavLink to="/forms/react-hook-form" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            React Hook Form
          </NavLink>
        </nav>
      </aside>

      {/* ===== Main Content — рендерится текущий роут ===== */}
      <main className="main-content">
        {/*
          Outlet — это "слот" из react-router-dom.
          Сюда подставляется компонент текущего маршрута.
          Аналог {children} для layout-компонентов.
        */}
        <Outlet />
      </main>
    </div>
  );
}
