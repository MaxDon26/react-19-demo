/**
 * ZodValidation — валидация форм с Zod + React Hook Form
 *
 * Zod — TypeScript-first библиотека валидации.
 * Главное преимущество: z.infer<typeof schema> автоматически
 * выводит ТОЧНЫЙ TypeScript-тип из схемы.
 *
 * Zod API:
 * - z.string() — строка
 * - z.number() — число
 * - z.boolean() — булево
 * - z.enum([...]) — перечисление
 * - z.array(z.string()) — массив строк
 * - z.object({...}) — объект
 * - .min(n, msg) / .max(n, msg) — ограничения
 * - .email(msg) — email
 * - .regex(pattern, msg) — регулярное выражение
 * - .refine(fn, msg) — кастомное правило
 * - .superRefine(fn) — кастомное правило с полным контролем
 * - .transform(fn) — трансформация значения
 */

import { useForm } from 'react-hook-form';
import { standardSchemaResolver } from '@hookform/resolvers/standard-schema';
import { z } from 'zod';
import { useState } from 'react';

// ===== Zod-схема валидации =====

/**
 * Zod-схема — описывает структуру + правила + типы одновременно.
 *
 * В отличие от Yup, Zod:
 * 1. TypeScript-first — z.infer выводит точные типы
 * 2. Нет required() — поля обязательны по умолчанию
 * 3. .refine() вместо .test() для кастомных правил
 * 4. .superRefine() для сложных кросс-полевых валидаций
 */
const profileSchema = z
  .object({
    // Строка: min(1) заменяет required (Zod не имеет .required())
    firstName: z
      .string()
      .min(1, 'Имя обязательно')
      .min(2, 'Минимум 2 символа')
      .max(30, 'Максимум 30 символов'),

    lastName: z
      .string()
      .min(1, 'Фамилия обязательна')
      .min(2, 'Минимум 2 символа'),

    email: z
      .string()
      .min(1, 'Email обязателен')
      .email('Некорректный email'),

    // Пароль с regex-правилами
    password: z
      .string()
      .min(8, 'Минимум 8 символов')
      .regex(/[a-z]/, 'Нужна строчная буква')
      .regex(/[A-Z]/, 'Нужна заглавная буква')
      .regex(/\d/, 'Нужна цифра')
      .regex(/[^a-zA-Z\d]/, 'Нужен спецсимвол (!@#$...)'),

    confirmPassword: z.string().min(1, 'Подтвердите пароль'),

    // Enum — только указанные значения
    // Zod 4: второй аргумент — строка-сообщение или { error: string }
    role: z.enum(['frontend', 'backend', 'fullstack', 'devops'], {
      error: 'Выберите специализацию',
    }),

    // Число с ограничениями
    // Zod 4: вместо invalid_type_error используем { error: msg }
    experience: z
      .number({ error: 'Введите число' })
      .min(0, 'Не может быть отрицательным')
      .max(50, 'Максимум 50 лет'),

    // Опциональное поле — .optional() или z.string().optional()
    github: z
      .string()
      .url('Некорректный URL')
      .optional()
      .or(z.literal('')), // Пустая строка тоже допустима

    // Навыки — просто строка (без transform для совместимости типов с useForm)
    skills: z
      .string()
      .min(1, 'Введите навыки через запятую'),

    // Boolean — z.literal(true) с сообщением об ошибке
    // Zod 4: { error: msg }
    agreeToTerms: z.literal(true, {
      error: 'Необходимо принять условия',
    }),
  })
  /**
   * .refine() — кастомная валидация на уровне всего объекта.
   *
   * Используется для кросс-полевых проверок
   * (например, password === confirmPassword).
   *
   * path — указывает, к какому полю привязать ошибку.
   */
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Пароли не совпадают',
    path: ['confirmPassword'], // Ошибка появится у confirmPassword
  });

/**
 * z.infer — АВТОМАТИЧЕСКИ выводит TypeScript-тип из схемы.
 *
 * Это главное преимущество Zod над Yup:
 * - Тип всегда синхронизирован со схемой
 * - Невозможно забыть обновить тип при изменении схемы
 * - Полная поддержка discriminated unions, optional
 */
type ProfileFormData = z.infer<typeof profileSchema>;

// ===== Компонент =====

export default function ZodValidation() {
  const [submitResult, setSubmitResult] = useState<ProfileFormData | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<ProfileFormData>({
    // standardSchemaResolver — универсальный resolver для Zod 4
    // Zod 4 реализует Standard Schema spec, поэтому работает без type-хаков
    resolver: standardSchemaResolver(profileSchema),
    mode: 'onBlur',
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: '',
      role: undefined as unknown as ProfileFormData['role'],
      experience: undefined as unknown as number,
      github: '',
      skills: '',
      agreeToTerms: undefined as unknown as true,
    },
  });

  const onSubmit = async (data: ProfileFormData) => {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    // Навыки из строки в массив (ручная трансформация)
    const result = {
      ...data,
      skills: data.skills
        .split(',')
        .map((s: string) => s.trim())
        .filter(Boolean),
    };
    setSubmitResult(data);
    console.log('Zod validated:', result);
  };

  return (
    <div>
      <div className="page-header">
        <span className="page-tag form">Формы</span>
        <h2>Zod-валидация</h2>
        <p>
          TypeScript-first валидация. Автовывод типов, regex-правила,
          кросс-полевая валидация, трансформация данных.
        </p>
      </div>

      <div className="info-box info">
        <code>z.infer&lt;typeof schema&gt;</code> выводит TypeScript-тип автоматически.
        Тип всегда синхронизирован со схемой — невозможно "забыть" обновить.
        <code>.transform()</code> преобразует данные (строка навыков → массив).
      </div>

      {submitResult ? (
        <div className="demo-section">
          <div className="info-box success">
            Форма отправлена! Обратите внимание: skills трансформированы из строки в массив.
          </div>
          <div className="demo-result">
            <pre>{JSON.stringify(submitResult, null, 2)}</pre>
          </div>
          <button
            className="btn btn-secondary mt-3"
            onClick={() => {
              setSubmitResult(null);
              reset();
            }}
          >
            Заполнить снова
          </button>
        </div>
      ) : (
        <div className="demo-section">
          <form onSubmit={handleSubmit(onSubmit)}>
            {/* Имя и Фамилия в одну строку */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="form-group">
                <label>Имя *</label>
                <input
                  {...register('firstName')}
                  className={`form-input ${errors.firstName ? 'error' : ''}`}
                  placeholder="Алексей"
                />
                {errors.firstName && (
                  <div className="form-error">{errors.firstName.message}</div>
                )}
              </div>
              <div className="form-group">
                <label>Фамилия *</label>
                <input
                  {...register('lastName')}
                  className={`form-input ${errors.lastName ? 'error' : ''}`}
                  placeholder="Иванов"
                />
                {errors.lastName && (
                  <div className="form-error">{errors.lastName.message}</div>
                )}
              </div>
            </div>

            {/* Email */}
            <div className="form-group">
              <label>Email *</label>
              <input
                {...register('email')}
                className={`form-input ${errors.email ? 'error' : ''}`}
                placeholder="dev@example.com"
              />
              {errors.email && (
                <div className="form-error">{errors.email.message}</div>
              )}
            </div>

            {/* Пароль */}
            <div className="form-group">
              <label>Пароль *</label>
              <input
                type="password"
                {...register('password')}
                className={`form-input ${errors.password ? 'error' : ''}`}
                placeholder="Мин. 8 символов + A-Z + a-z + 0-9 + спецсимвол"
              />
              {errors.password && (
                <div className="form-error">{errors.password.message}</div>
              )}
              <div className="form-hint">
                Требуется: строчная, заглавная, цифра, спецсимвол
              </div>
            </div>

            {/* Подтверждение пароля */}
            <div className="form-group">
              <label>Подтвердите пароль *</label>
              <input
                type="password"
                {...register('confirmPassword')}
                className={`form-input ${errors.confirmPassword ? 'error' : ''}`}
                placeholder="Повторите пароль"
              />
              {errors.confirmPassword && (
                <div className="form-error">{errors.confirmPassword.message}</div>
              )}
            </div>

            {/* Специализация и опыт */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="form-group">
                <label>Специализация *</label>
                <select
                  {...register('role')}
                  className={`form-select ${errors.role ? 'error' : ''}`}
                >
                  <option value="">Выберите</option>
                  <option value="frontend">Frontend</option>
                  <option value="backend">Backend</option>
                  <option value="fullstack">Fullstack</option>
                  <option value="devops">DevOps</option>
                </select>
                {errors.role && (
                  <div className="form-error">{errors.role.message}</div>
                )}
              </div>
              <div className="form-group">
                <label>Опыт (лет) *</label>
                <input
                  type="number"
                  {...register('experience', { valueAsNumber: true })}
                  className={`form-input ${errors.experience ? 'error' : ''}`}
                  placeholder="0-50"
                />
                {errors.experience && (
                  <div className="form-error">{errors.experience.message}</div>
                )}
              </div>
            </div>

            {/* GitHub */}
            <div className="form-group">
              <label>GitHub (необязательно)</label>
              <input
                {...register('github')}
                className={`form-input ${errors.github ? 'error' : ''}`}
                placeholder="https://github.com/username"
              />
              {errors.github && (
                <div className="form-error">{errors.github.message}</div>
              )}
            </div>

            {/* Навыки — демо .transform() */}
            <div className="form-group">
              <label>Навыки * (через запятую)</label>
              <input
                {...register('skills')}
                className={`form-input ${errors.skills ? 'error' : ''}`}
                placeholder="React, TypeScript, Node.js"
              />
              {errors.skills && (
                <div className="form-error">{errors.skills.message}</div>
              )}
              <div className="form-hint">
                Zod .transform() автоматически преобразует строку в массив
              </div>
            </div>

            {/* Согласие */}
            <div className="form-group">
              <label className="form-checkbox">
                <input type="checkbox" {...register('agreeToTerms')} />
                Принимаю условия использования
              </label>
              {errors.agreeToTerms && (
                <div className="form-error">{errors.agreeToTerms.message}</div>
              )}
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <span className="spinner" /> Отправка...
                </>
              ) : (
                'Создать профиль'
              )}
            </button>
          </form>
        </div>
      )}

      {/* Сравнение Yup vs Zod */}
      <div className="demo-section mt-3">
        <h3>Zod vs Yup</h3>
        <table className="comparison-table">
          <thead>
            <tr>
              <th>Критерий</th>
              <th>Yup</th>
              <th>Zod</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>TypeScript-first</td>
              <td>Нет (JS → TS)</td>
              <td>Да (нативно)</td>
            </tr>
            <tr>
              <td>Вывод типов</td>
              <td><code>InferType</code> (частичный)</td>
              <td><code>z.infer</code> (полный)</td>
            </tr>
            <tr>
              <td>Обязательность</td>
              <td>По умолчанию опционально</td>
              <td>По умолчанию обязательно</td>
            </tr>
            <tr>
              <td>Кастомные правила</td>
              <td><code>.test(name, msg, fn)</code></td>
              <td><code>.refine(fn, msg)</code></td>
            </tr>
            <tr>
              <td>Трансформация</td>
              <td><code>.transform(fn)</code></td>
              <td><code>.transform(fn).pipe(schema)</code></td>
            </tr>
            <tr>
              <td>Размер бандла</td>
              <td>~15 KB</td>
              <td>~13 KB</td>
            </tr>
            <tr>
              <td>Рекомендация</td>
              <td>Существующие проекты</td>
              <td>Новые TS-проекты</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
