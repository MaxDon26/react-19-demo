/**
 * UseTransitionDemo — демонстрация useTransition
 *
 * useTransition — хук для неблокирующих (low-priority) обновлений состояния.
 *
 * Проблема, которую решает:
 * Тяжёлое обновление (фильтрация 10000 элементов) блокирует UI.
 * Пока React рендерит отфильтрованный список — input "зависает".
 *
 * Решение:
 * startTransition оборачивает тяжёлое обновление.
 * React даёт приоритет лёгким обновлениям (input) и прерывает
 * тяжёлый рендер при новом вводе.
 *
 * Сигнатура:
 *   const [isPending, startTransition] = useTransition();
 *
 * - isPending: boolean — идёт ли transition (для индикатора загрузки)
 * - startTransition(fn) — оборачивает обновление состояния
 */

import { useState, useTransition, memo } from 'react';
import { CITIES } from '../../utils/api';

/**
 * Генерируем ОЧЕНЬ большой список — 10 000 элементов.
 *
 * Почему именно столько:
 * - 1 000 элементов — современный ПК рендерит мгновенно, разница не видна
 * - 10 000 элементов — рендер занимает ~200-500мс, разница ощутима
 * - Каждый элемент рендерится как DOM-нода — это главная нагрузка
 *
 * useTransition помогает именно с РЕНДЕРОМ (не с вычислениями).
 * Пока React рендерит 10 000 нод — input "зависает" без transition.
 */
const BIG_LIST = Array.from({ length: 200 }, (_, i) =>
  CITIES.map((city) => `${city} #${i + 1}`)
).flat(); // 50 городов × 200 = 10 000 элементов

/**
 * SlowItem — намеренно "тяжёлый" компонент.
 *
 * Каждый экземпляр тратит ~0.03мс на рендер (busy-wait).
 * 10 000 элементов × 0.03мс = ~300мс блокировки main thread.
 *
 * Это имитирует реальную ситуацию: каждый элемент списка
 * имеет сложную разметку, вычисления, стили.
 *
 * memo() предотвращает повторный рендер элементов, если props не изменились.
 * Но при фильтрации массив меняется — все элементы перерендериваются.
 */
const SlowItem = memo(function SlowItem({ text }: { text: string }) {
  // Искусственное замедление рендера каждого элемента
  const start = performance.now();
  while (performance.now() - start < 0.03) {
    // ~0.03мс на элемент × 10 000 = ~300мс общей блокировки
  }

  return (
    <div
      style={{
        padding: '4px 12px',
        fontSize: '13px',
        borderBottom: '1px solid var(--border)',
      }}
    >
      {text}
    </div>
  );
});

export default function UseTransitionDemo() {
  // ===== Без useTransition =====
  const [queryBlocking, setQueryBlocking] = useState('');
  const [resultsBlocking, setResultsBlocking] = useState<string[]>(BIG_LIST);

  /**
   * Обычный обработчик БЕЗ useTransition.
   * Оба setState выполняются с ОДИНАКОВЫМ приоритетом.
   *
   * React батчит их и рендерит input + 10 000 элементов списка
   * в одном цикле. Пока идёт рендер — main thread заблокирован,
   * input "зависает", пользователь не видит свой ввод.
   */
  function handleSearchBlocking(value: string) {
    setQueryBlocking(value);
    // Фильтрация + рендер 10 000 элементов — блокирует UI
    const filtered = value.trim()
      ? BIG_LIST.filter((item) => item.toLowerCase().includes(value.toLowerCase()))
      : BIG_LIST;
    setResultsBlocking(filtered);
  }

  // ===== С useTransition =====
  const [queryTransition, setQueryTransition] = useState('');
  const [resultsTransition, setResultsTransition] = useState<string[]>(BIG_LIST);

  /**
   * isPending — true, пока transition не завершился.
   * Можно показать индикатор загрузки.
   *
   * startTransition — оборачивает обновление, помечая его как "низкоприоритетное".
   * React может ПРЕРВАТЬ это обновление, если появится новый ввод.
   */
  const [isPending, startTransition] = useTransition();

  /**
   * Обработчик С useTransition.
   *
   * Два setState с РАЗНЫМИ приоритетами:
   * 1. setQueryTransition — ВЫСОКИЙ приоритет (input обновляется мгновенно)
   * 2. setResultsTransition внутри startTransition — НИЗКИЙ приоритет
   *
   * React обрабатывает высокоприоритетное обновление ПЕРВЫМ.
   * Рендер 10 000 элементов откладывается и может быть ПРЕРВАН,
   * если пользователь продолжает печатать.
   */
  function handleSearchTransition(value: string) {
    // Высокий приоритет — input обновляется сразу, пользователь видит ввод
    setQueryTransition(value);

    // Низкий приоритет — React может прервать рендер при новом вводе
    startTransition(() => {
      const filtered = value.trim()
        ? BIG_LIST.filter((item) => item.toLowerCase().includes(value.toLowerCase()))
        : BIG_LIST;
      setResultsTransition(filtered);
    });
  }

  // Подсчёт для статистики
  const totalItems = BIG_LIST.length;

  return (
    <div>
      <div className="page-header">
        <span className="page-tag hook">Hook</span>
        <h2>useTransition</h2>
        <p>
          Разделение обновлений по приоритету. Input не зависает при тяжёлой фильтрации.
        </p>
      </div>

      <div className="info-box info">
        <code>startTransition(() =&gt; setState(...))</code> помечает обновление
        как низкоприоритетное. React обработает высокоприоритетные обновления
        (пользовательский ввод) первыми, и может прервать transition при новом вводе.
      </div>

      {/* Статистика */}
      <div className="info-box warning">
        Список содержит <strong>{totalItems.toLocaleString()} элементов</strong>.
        Каждый рендерится как отдельный DOM-узел — это реальная нагрузка.
        Попробуйте <strong>быстро печатать</strong> в оба поля — разница ощутима.
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {/* Колонка 1: БЕЗ useTransition */}
        <div className="demo-section">
          <h3>БЕЗ useTransition</h3>
          <p className="card-description">
            Input и список обновляются одновременно.
            При вводе — заметное "зависание".
          </p>

          <div className="form-group">
            <label>Поиск города (blocking)</label>
            <input
              className="form-input"
              value={queryBlocking}
              onChange={(e) => handleSearchBlocking(e.target.value)}
              placeholder="Начните вводить..."
            />
          </div>

          <div
            style={{
              fontSize: '13px',
              color: 'var(--text-muted)',
              marginBottom: '8px',
            }}
          >
            Найдено: {resultsBlocking.length} из {totalItems}
          </div>

          {/*
            Рендерим ВСЕ элементы — именно это создаёт нагрузку.
            React должен создать/обновить 10 000 DOM-нод.
            Без useTransition это блокирует main thread.
          */}
          <div
            style={{
              maxHeight: '300px',
              overflow: 'auto',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
            }}
          >
            {resultsBlocking.map((city, i) => (
              <SlowItem key={i} text={city} />
            ))}
          </div>
        </div>

        {/* Колонка 2: С useTransition */}
        <div className="demo-section">
          <h3>С useTransition</h3>
          <p className="card-description">
            Input обновляется мгновенно. Список фильтруется
            в "фоне" (low-priority).
          </p>

          <div className="form-group">
            <label>Поиск города (non-blocking)</label>
            <input
              className="form-input"
              value={queryTransition}
              onChange={(e) => handleSearchTransition(e.target.value)}
              placeholder="Начните вводить..."
            />
          </div>

          <div
            className="flex items-center gap-2"
            style={{
              fontSize: '13px',
              color: 'var(--text-muted)',
              marginBottom: '8px',
            }}
          >
            {/* isPending показывает, что transition ещё выполняется */}
            {isPending && <span className="spinner" />}
            <span>
              {isPending
                ? 'Фильтрация...'
                : `Найдено: ${resultsTransition.length} из ${totalItems}`}
            </span>
          </div>

          <div
            style={{
              maxHeight: '300px',
              overflow: 'auto',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              // Полупрозрачность во время transition — визуальный фидбек
              opacity: isPending ? 0.6 : 1,
              transition: 'opacity 0.2s',
            }}
          >
            {resultsTransition.map((city, i) => (
              <SlowItem key={i} text={city} />
            ))}
          </div>
        </div>
      </div>

      <div className="info-box success mt-4">
        <strong>Ключевое отличие:</strong> без useTransition оба обновления
        (input + список) блокируют друг друга. С useTransition — input отвечает
        мгновенно, а список обновляется когда React "освободится".
      </div>
    </div>
  );
}
