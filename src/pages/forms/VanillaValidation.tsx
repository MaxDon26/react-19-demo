/**
 * VanillaValidation — кастомная валидация без библиотек
 *
 * Показывает конфигурационный подход к валидации:
 * - Универсальный валидатор, который принимает схему правил
 * - Каждое правило = { check, message } — функция проверки + текст ошибки
 * - Правила проверяются последовательно (первая ошибка побеждает)
 * - Поддержка кросс-полевых проверок (confirmPassword === password)
 *
 * Плюсы: полный контроль, 0 зависимостей, легко добавлять поля
 * Минусы: много бойлерплейта для touched/blur логики
 */

import { useState } from 'react';

// ===== Универсальный валидатор =====

/**
 * ValidationRule — одно правило валидации.
 *
 * check(value, allData) — функция проверки:
 *   - value: значение текущего поля
 *   - allData: все данные формы (для кросс-полевых проверок)
 *   - Возвращает true если поле ВАЛИДНО, false если нет
 *
 * message — текст ошибки при провале проверки
 */
interface ValidationRule<T> {
  check: (value: string, allData: T) => boolean;
  message: string;
}

/**
 * ValidationSchema — конфигурация валидации для всей формы.
 *
 * Ключ = имя поля, значение = массив правил.
 * Правила проверяются по порядку: первая ошибка побеждает.
 *
 * Пример:
 * {
 *   email: [
 *     { check: (v) => v.length > 0, message: 'Обязательно' },
 *     { check: (v) => v.includes('@'), message: 'Нужен @' },
 *   ]
 * }
 */
type ValidationSchema<T> = {
  [K in keyof T]?: ValidationRule<T>[];
};

/**
 * validate — универсальная функция валидации.
 *
 * Принимает данные формы и схему правил.
 * Для каждого поля проходит по правилам последовательно.
 * Останавливается на первой ошибке (как Zod/Yup).
 * Возвращает объект ошибок: { fieldName: 'Текст ошибки' }.
 * Пустой объект = всё валидно.
 */
function validate<T extends Record<string, string>>(
  data: T,
  schema: ValidationSchema<T>
): Partial<Record<keyof T, string>> {
  const errors: Partial<Record<keyof T, string>> = {};

  // Проходим по каждому полю, для которого есть правила
  for (const field in schema) {
    const rules = schema[field];
    if (!rules) continue;

    // Проверяем правила по порядку — первая ошибка побеждает
    for (const rule of rules) {
      if (!rule.check(data[field], data)) {
        errors[field] = rule.message;
        break; // Не проверяем остальные правила для этого поля
      }
    }
  }

  return errors;
}

// ===== Типы формы =====

interface RegistrationData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  age: string;
  website: string;
}

// ===== Схема валидации (конфигурация) =====

/**
 * Вся логика валидации описана декларативно.
 * Добавить новое поле = добавить запись в объект.
 * Изменить правило = изменить одну строку.
 *
 * Каждое правило — объект { check, message }:
 * - check получает (value, allData) — можно проверять кросс-поля
 * - Правила выполняются по порядку, первая ошибка прерывает цепочку
 */
const registrationSchema: ValidationSchema<RegistrationData> = {
  name: [
    { check: (v) => v.trim().length > 0, message: 'Имя обязательно' },
    { check: (v) => v.trim().length >= 2, message: 'Минимум 2 символа' },
    { check: (v) => v.trim().length <= 50, message: 'Максимум 50 символов' },
  ],

  email: [
    { check: (v) => v.length > 0, message: 'Email обязателен' },
    { check: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), message: 'Некорректный формат email' },
  ],

  password: [
    { check: (v) => v.length > 0, message: 'Пароль обязателен' },
    { check: (v) => v.length >= 8, message: 'Минимум 8 символов' },
    { check: (v) => /[a-z]/.test(v), message: 'Нужна хотя бы одна строчная буква' },
    { check: (v) => /[A-Z]/.test(v), message: 'Нужна хотя бы одна заглавная буква' },
    { check: (v) => /\d/.test(v), message: 'Нужна хотя бы одна цифра' },
  ],

  // Кросс-полевая проверка: второй аргумент (allData) содержит все поля формы
  confirmPassword: [
    { check: (v) => v.length > 0, message: 'Подтвердите пароль' },
    { check: (v, all) => v === all.password, message: 'Пароли не совпадают' },
  ],

  age: [
    { check: (v) => v.length > 0, message: 'Возраст обязателен' },
    { check: (v) => !isNaN(Number(v)), message: 'Введите число' },
    { check: (v) => Number(v) >= 18, message: 'Минимум 18 лет' },
    { check: (v) => Number(v) <= 120, message: 'Проверьте возраст' },
  ],

  // Необязательное поле: первое правило пропускает пустое значение
  website: [
    { check: (v) => !v || /^https?:\/\/.+\..+/.test(v), message: 'URL должен начинаться с http:// или https://' },
  ],
};

// ===== Компонент =====

export default function VanillaValidation() {
  // Данные формы
  const [formData, setFormData] = useState<RegistrationData>({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    age: '',
    website: '',
  });

  // Ошибки валидации — тип выводится из RegistrationData
  const [errors, setErrors] = useState<Partial<Record<keyof RegistrationData, string>>>({});

  /**
   * touched — множество полей, которые пользователь "тронул".
   *
   * Зачем: не показывать ошибки для полей, к которым пользователь
   * ещё не прикасался. Иначе при открытии формы — сразу все поля красные.
   *
   * Поле считается "тронутым" после:
   * - Потери фокуса (onBlur)
   * - Попытки submit (все поля помечаются touched)
   */
  const [touched, setTouched] = useState<Set<string>>(new Set());

  // Статус отправки
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success'>('idle');

  /**
   * handleChange — обработчик изменения поля.
   *
   * Обновляет данные формы.
   * Если поле уже "тронуто" — запускает валидацию для него.
   * Если НЕ тронуто — не показывает ошибку (UX: не раздражаем пользователя).
   */
  function handleChange(
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    const { name, value } = e.target;
    const newData = { ...formData, [name]: value };
    setFormData(newData);

    // Валидируем только "тронутые" поля при изменении
    if (touched.has(name)) {
      const newErrors = validate(newData, registrationSchema);
      // Обновляем ошибку ТОЛЬКО для текущего поля
      setErrors((prev) => ({
        ...prev,
        [name]: newErrors[name as keyof RegistrationData],
      }));
    }
  }

  /**
   * handleBlur — обработчик потери фокуса.
   *
   * 1. Помечаем поле как "тронутое"
   * 2. Запускаем валидацию
   * 3. Показываем ошибку (если есть)
   *
   * Это стандартный UX-паттерн: показывать ошибки после blur,
   * не во время ввода.
   */
  function handleBlur(e: React.FocusEvent<HTMLInputElement>) {
    const { name } = e.target;

    // Помечаем поле как "тронутое"
    setTouched((prev) => new Set(prev).add(name));

    // Валидируем и показываем ошибку
    const newErrors = validate(formData, registrationSchema);
    setErrors((prev) => ({
      ...prev,
      [name]: newErrors[name as keyof RegistrationData],
    }));
  }

  /**
   * handleSubmit — обработчик отправки формы.
   *
   * 1. Предотвращаем стандартный submit (e.preventDefault)
   * 2. Помечаем ВСЕ поля как "тронутые" (показываем все ошибки)
   * 3. Валидируем ВСЕ поля
   * 4. Если ошибок нет — отправляем
   */
  function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();

    // Помечаем ВСЕ поля как тронутые
    const allFields = Object.keys(formData);
    setTouched(new Set(allFields));

    // Полная валидация
    const validationErrors = validate(formData, registrationSchema);
    setErrors(validationErrors);

    // Если есть ошибки — не отправляем
    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    // Успех!
    setSubmitStatus('success');
    console.log('Form data:', formData);
  }

  /**
   * Вспомогательная функция: показывать ли ошибку для поля.
   * Ошибка показывается только если поле "тронуто" И есть ошибка.
   */
  const showError = (field: keyof RegistrationData): string | undefined => {
    return touched.has(field) ? errors[field] : undefined;
  };

  /**
   * Подсчёт силы пароля для визуального индикатора.
   */
  const passwordStrength = (() => {
    const p = formData.password;
    if (!p) return 0;
    let score = 0;
    if (p.length >= 8) score++;
    if (/[a-z]/.test(p)) score++;
    if (/[A-Z]/.test(p)) score++;
    if (/\d/.test(p)) score++;
    if (/[^a-zA-Z\d]/.test(p)) score++;
    return score;
  })();

  const strengthLabels = ['', 'Слабый', 'Средний', 'Хороший', 'Сильный', 'Отличный'];
  const strengthColors = ['', 'var(--error)', 'var(--warning)', 'var(--warning)', 'var(--success)', 'var(--success)'];

  return (
    <div>
      <div className="page-header">
        <span className="page-tag form">Формы</span>
        <h2>Vanilla-валидация</h2>
        <p>
          Конфигурационный подход без библиотек. Универсальный валидатор
          принимает схему правил — не нужно писать if/else для каждого поля.
        </p>
      </div>

      <div className="info-box info">
        Правила описаны в объекте <code>registrationSchema</code> — массив{' '}
        <code>{'{ check, message }'}</code> для каждого поля.
        Универсальная функция <code>validate(data, schema)</code> проверяет все поля по конфигурации.
      </div>

      {submitStatus === 'success' ? (
        <div className="demo-section">
          <div className="info-box success">
            Форма успешно отправлена!
          </div>
          <div className="demo-result">
            <pre>{JSON.stringify(formData, null, 2)}</pre>
          </div>
          <button
            className="btn btn-secondary mt-3"
            onClick={() => {
              setFormData({ name: '', email: '', password: '', confirmPassword: '', age: '', website: '' });
              setErrors({});
              setTouched(new Set());
              setSubmitStatus('idle');
            }}
          >
            Заполнить снова
          </button>
        </div>
      ) : (
        <div className="demo-section">
          <form onSubmit={handleSubmit}>
            {/* Имя */}
            <div className="form-group">
              <label>Имя *</label>
              <input
                name="name"
                className={`form-input ${showError('name') ? 'error' : ''}`}
                value={formData.name}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="Минимум 2 символа"
              />
              {showError('name') && (
                <div className="form-error">{showError('name')}</div>
              )}
            </div>

            {/* Email */}
            <div className="form-group">
              <label>Email *</label>
              <input
                name="email"
                type="text" // Специально text, не email — валидируем сами
                className={`form-input ${showError('email') ? 'error' : ''}`}
                value={formData.email}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="user@example.com"
              />
              {showError('email') && (
                <div className="form-error">{showError('email')}</div>
              )}
            </div>

            {/* Пароль */}
            <div className="form-group">
              <label>Пароль *</label>
              <input
                name="password"
                type="password"
                className={`form-input ${showError('password') ? 'error' : ''}`}
                value={formData.password}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="Мин. 8 символов, a-z, A-Z, 0-9"
              />
              {showError('password') && (
                <div className="form-error">{showError('password')}</div>
              )}
              {/* Индикатор силы пароля */}
              {formData.password && (
                <div className="mt-2">
                  <div style={{ display: 'flex', gap: '4px', marginBottom: '4px' }}>
                    {[1, 2, 3, 4, 5].map((level) => (
                      <div
                        key={level}
                        style={{
                          height: '4px',
                          flex: 1,
                          borderRadius: '2px',
                          background:
                            level <= passwordStrength
                              ? strengthColors[passwordStrength]
                              : 'var(--border)',
                        }}
                      />
                    ))}
                  </div>
                  <div style={{ fontSize: '12px', color: strengthColors[passwordStrength] }}>
                    {strengthLabels[passwordStrength]}
                  </div>
                </div>
              )}
            </div>

            {/* Подтверждение пароля */}
            <div className="form-group">
              <label>Подтвердите пароль *</label>
              <input
                name="confirmPassword"
                type="password"
                className={`form-input ${showError('confirmPassword') ? 'error' : ''}`}
                value={formData.confirmPassword}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="Повторите пароль"
              />
              {showError('confirmPassword') && (
                <div className="form-error">{showError('confirmPassword')}</div>
              )}
            </div>

            {/* Возраст */}
            <div className="form-group">
              <label>Возраст *</label>
              <input
                name="age"
                type="number"
                className={`form-input ${showError('age') ? 'error' : ''}`}
                value={formData.age}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="18-120"
              />
              {showError('age') && (
                <div className="form-error">{showError('age')}</div>
              )}
            </div>

            {/* Сайт (необязательный) */}
            <div className="form-group">
              <label>Сайт (необязательно)</label>
              <input
                name="website"
                className={`form-input ${showError('website') ? 'error' : ''}`}
                value={formData.website}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="https://example.com"
              />
              {showError('website') && (
                <div className="form-error">{showError('website')}</div>
              )}
              <div className="form-hint">Должен начинаться с http:// или https://</div>
            </div>

            <button type="submit" className="btn btn-primary">
              Зарегистрироваться
            </button>
          </form>
        </div>
      )}

      {/* Сравнение подходов */}
      <div className="info-box warning mt-3">
        <strong>Минусы vanilla-подхода:</strong> много бойлерплейта (handleChange, handleBlur,
        touched-логика). Для сложных форм лучше использовать React Hook Form + Zod/Yup.
      </div>
    </div>
  );
}
