/**
 * App — корневой компонент с маршрутизацией.
 *
 * Использует react-router-dom v7 для клиентской навигации.
 *
 * Структура маршрутов:
 * - / — Layout (sidebar + Outlet)
 *   - index — Home (карта проектов)
 *   - /hooks/* — демо хуков React 19
 *   - /forms/* — демо форм и валидации
 *
 * BrowserRouter — использует History API для навигации без перезагрузки.
 * Route с element={<Layout />} — оборачивает все дочерние роуты
 * в единый layout с sidebar.
 */

import { BrowserRouter, Routes, Route } from 'react-router-dom';

// Layout
import Layout from './components/Layout';

// Pages
import Home from './pages/Home';

// Hooks
import UseDemo from './pages/hooks/UseDemo';
import UseActionStateDemo from './pages/hooks/UseActionStateDemo';
import UseFormStatusDemo from './pages/hooks/UseFormStatusDemo';
import UseOptimisticDemo from './pages/hooks/UseOptimisticDemo';
import UseTransitionDemo from './pages/hooks/UseTransitionDemo';
import React19Changes from './pages/hooks/React19Changes';

// Forms
import EventsDemo from './pages/forms/EventsDemo';
import VanillaValidation from './pages/forms/VanillaValidation';
import YupValidation from './pages/forms/YupValidation';
import ZodValidation from './pages/forms/ZodValidation';
import ReactHookFormDemo from './pages/forms/ReactHookFormDemo';

export default function App() {
  return (
    /**
     * BrowserRouter — провайдер роутинга.
     * Использует History API (pushState, popState).
     * Все компоненты внутри получают доступ к навигации.
     */
    <BrowserRouter>
      {/*
        Routes — контейнер для маршрутов.
        React Router матчит URL и рендерит соответствующий компонент.
      */}
      <Routes>
        {/*
          Route с element={<Layout />} — layout-роут.
          Layout содержит <Outlet />, куда подставляются дочерние роуты.
          Это позволяет иметь общий sidebar для всех страниц.
        */}
        <Route path="/" element={<Layout />}>
          {/* index — роут по умолчанию для "/" */}
          <Route index element={<Home />} />

          {/* Хуки React 19 */}
          <Route path="hooks/use" element={<UseDemo />} />
          <Route path="hooks/use-action-state" element={<UseActionStateDemo />} />
          <Route path="hooks/use-form-status" element={<UseFormStatusDemo />} />
          <Route path="hooks/use-optimistic" element={<UseOptimisticDemo />} />
          <Route path="hooks/use-transition" element={<UseTransitionDemo />} />
          <Route path="hooks/react19-changes" element={<React19Changes />} />

          {/* Формы и валидация */}
          <Route path="forms/events" element={<EventsDemo />} />
          <Route path="forms/vanilla" element={<VanillaValidation />} />
          <Route path="forms/yup" element={<YupValidation />} />
          <Route path="forms/zod" element={<ZodValidation />} />
          <Route path="forms/react-hook-form" element={<ReactHookFormDemo />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
