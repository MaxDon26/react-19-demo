/**
 * YupValidation — валидация форм с Yup + React Hook Form
 *
 * Yup — декларативная библиотека валидации со схемами.
 * Интегрируется с React Hook Form через @hookform/resolvers.
 *
 * Yup API:
 * - yup.string() — строковое поле
 * - yup.number() — числовое поле
 * - yup.boolean() — булево поле
 * - yup.object() — объект (корневая схема)
 * - .required(msg) — обязательное
 * - .min(n, msg) / .max(n, msg) — ограничения
 * - .email(msg) — валидация email
 * - .oneOf([values], msg) — одно из значений
 * - .test(name, msg, fn) — кастомное правило
 *
 * Тип формы можно вывести через yup.InferType<typeof schema>
 * (но вывод типов у Yup хуже, чем у Zod)
 */

import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useState } from "react";

// ===== Схема валидации Yup =====

/**
 * Определяем схему — ВСЕ правила валидации в одном месте.
 * Декларативный подход: описываем ЧТО хотим, не КАК проверять.
 */
const registrationSchema = yup.object({
  // Имя: обязательное, от 2 до 50 символов
  name: yup.string().required("Имя обязательно").min(2, "Минимум 2 символа").max(50, "Максимум 50 символов"),

  // Email: обязательный, проверка формата
  email: yup.string().required("Email обязателен").email("Некорректный формат email"),

  // Возраст: обязательный, от 18 до 120
  // typeError — сообщение когда значение не является числом
  age: yup
    .number()
    .required("Возраст обязателен")
    .min(18, "Минимум 18 лет")
    .max(120, "Максимум 120 лет")
    .typeError("Введите число"),

  // Пароль: обязательный, минимум 8 символов + кастомная проверка
  password: yup
    .string()
    .required("Пароль обязателен")
    .min(8, "Минимум 8 символов")
    // .test() — кастомное правило валидации
    .test(
      "has-uppercase", // уникальное имя теста
      "Нужна хотя бы одна заглавная буква", // сообщение об ошибке
      (value) => /[A-Z]/.test(value || ""), // функция проверки
    )
    .test("has-lowercase", "Нужна хотя бы одна строчная буква", (value) => /[a-z]/.test(value || ""))
    .test("has-number", "Нужна хотя бы одна цифра", (value) => /\d/.test(value || "")),

  // Сайт: необязательный, но если заполнен — должен быть URL
  // .default('') гарантирует, что тип будет string (не string | undefined)
  // Это решает проблему совместимости типов с resolver
  website: yup.string().url("Некорректный URL").default(""),

  // Роль: одна из перечисленных
  role: yup
    .string()
    .oneOf(["developer", "designer", "manager", "other"], "Выберите роль из списка")
    .required("Роль обязательна"),

  // Согласие с условиями: обязательно true
  agreeToTerms: yup.boolean().oneOf([true], "Необходимо принять условия").required("Необходимо принять условия"),
});

/**
 * InferType — выводит TypeScript-тип из схемы Yup.
 *
 * Ограничение: InferType у Yup менее точный, чем z.infer у Zod.
 * Например, optional поля выводятся как string | undefined,
 * а не как optional property.
 */
type RegistrationFormData = yup.InferType<typeof registrationSchema>;

// ===== Компонент =====

export default function YupValidation() {
  const [submitResult, setSubmitResult] = useState<RegistrationFormData | null>(null);

  /**
   * useForm + yupResolver — связывает React Hook Form с Yup-схемой.
   *
   * resolver: yupResolver(schema) — при submit React Hook Form
   * передаёт данные в Yup для валидации. Если ошибки — они автоматически
   * попадают в formState.errors.
   *
   * mode: 'onBlur' — валидация запускается при потере фокуса.
   * Другие варианты:
   * - 'onSubmit' — только при submit (по умолчанию)
   * - 'onChange' — при каждом изменении
   * - 'onTouched' — при первом blur, затем при каждом изменении
   * - 'all' — при blur + onChange
   */
  const {
    register, // Регистрирует поле в форме (возвращает props: ref, onChange, onBlur, name)
    handleSubmit, // Оборачивает onSubmit: валидация → если ОК → вызов callback
    formState: {
      errors, // Объект ошибок: { fieldName: { message, type } }
      isSubmitting, // true пока onSubmit выполняется
      // isValid — true если нет ошибок (после первой валидации)
      // touchedFields — какие поля были "тронуты"
    },
    reset, // Сбросить форму к defaultValues
  } = useForm<RegistrationFormData>({
    resolver: yupResolver(registrationSchema),
    mode: "onBlur", // Валидация по потере фокуса
    defaultValues: {
      name: "",
      email: "",
      age: undefined,
      password: "",
      website: "",
      role: undefined,
      agreeToTerms: false,
    },
  });

  /**
   * onSubmit — вызывается ТОЛЬКО если валидация прошла успешно.
   * React Hook Form НЕ вызовет эту функцию, если есть ошибки Yup.
   * Данные уже типизированы как RegistrationFormData.
   */
  const onSubmit = async (data: RegistrationFormData) => {
    // Имитация отправки
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setSubmitResult(data);
    console.log("Yup validated data:", data);
  };

  return (
    <div>
      <div className="page-header">
        <span className="page-tag form">Формы</span>
        <h2>Yup-валидация</h2>
        <p>Схемная валидация с Yup + React Hook Form. Все правила описаны декларативно в одном месте.</p>
      </div>

      <div className="info-box info">
        <code>yupResolver(schema)</code> связывает Yup-схему с React Hook Form. Ошибки автоматически попадают в{" "}
        <code>formState.errors</code>. Режим <code>onBlur</code> — валидация при потере фокуса.
      </div>

      {submitResult ? (
        <div className="demo-section">
          <div className="info-box success">Форма успешно отправлена!</div>
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
          {/*
            handleSubmit(onSubmit) — HOC, который:
            1. Предотвращает стандартный submit
            2. Запускает Yup-валидацию
            3. Если ОК — вызывает onSubmit(data)
            4. Если ошибки — записывает в errors
          */}
          <form onSubmit={handleSubmit(onSubmit)}>
            {/* Имя */}
            <div className="form-group">
              <label>Имя *</label>
              {/*
                register('name') возвращает:
                { name: 'name', ref: Ref, onChange: fn, onBlur: fn }
                Спред-оператор (...) добавляет их как props к input.
              */}
              <input className={`form-input ${errors.name ? "error" : ""}`} placeholder="Минимум 2 символа" />
              {errors.name && <div className="form-error">{errors.name.message}</div>}
            </div>

            {/* Email */}
            <div className="form-group">
              <label>Email *</label>
              <input
                {...register("email")}
                className={`form-input ${errors.email ? "error" : ""}`}
                placeholder="user@example.com"
              />
              {errors.email && <div className="form-error">{errors.email.message}</div>}
            </div>

            {/* Возраст */}
            <div className="form-group">
              <label>Возраст *</label>
              <input
                type="number"
                {...register("age")}
                className={`form-input ${errors.age ? "error" : ""}`}
                placeholder="18-120"
              />
              {errors.age && <div className="form-error">{errors.age.message}</div>}
            </div>

            {/* Пароль */}
            <div className="form-group">
              <label>Пароль *</label>
              <input
                type="password"
                {...register("password")}
                className={`form-input ${errors.password ? "error" : ""}`}
                placeholder="Мин. 8 символов, A-Z, a-z, 0-9"
              />
              {errors.password && <div className="form-error">{errors.password.message}</div>}
            </div>

            {/* Сайт */}
            <div className="form-group">
              <label>Сайт (необязательно)</label>
              <input
                {...register("website")}
                className={`form-input ${errors.website ? "error" : ""}`}
                placeholder="https://example.com"
              />
              {errors.website && <div className="form-error">{errors.website.message}</div>}
            </div>

            {/* Роль */}
            <div className="form-group">
              <label>Роль *</label>
              <select {...register("role")} className={`form-select ${errors.role ? "error" : ""}`}>
                <option value="">Выберите роль</option>
                <option value="developer">Developer</option>
                <option value="designer">Designer</option>
                <option value="manager">Manager</option>
                <option value="other">Другое</option>
              </select>
              {errors.role && <div className="form-error">{errors.role.message}</div>}
            </div>

            {/* Согласие */}
            <div className="form-group">
              <label className="form-checkbox">
                <input type="checkbox" {...register("agreeToTerms")} />
                Принимаю условия использования
              </label>
              {errors.agreeToTerms && <div className="form-error">{errors.agreeToTerms.message}</div>}
            </div>

            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <span className="spinner" /> Отправка...
                </>
              ) : (
                "Зарегистрироваться"
              )}
            </button>
          </form>
        </div>
      )}

      {/* Справка по Yup API */}
      <div className="demo-section mt-3">
        <h3>Основные методы Yup</h3>
        <table className="comparison-table">
          <thead>
            <tr>
              <th>Метод</th>
              <th>Описание</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <code>.required(msg)</code>
              </td>
              <td>Поле обязательно</td>
            </tr>
            <tr>
              <td>
                <code>.min(n, msg)</code>
              </td>
              <td>Минимальная длина / значение</td>
            </tr>
            <tr>
              <td>
                <code>.max(n, msg)</code>
              </td>
              <td>Максимальная длина / значение</td>
            </tr>
            <tr>
              <td>
                <code>.email(msg)</code>
              </td>
              <td>Проверка формата email</td>
            </tr>
            <tr>
              <td>
                <code>.url(msg)</code>
              </td>
              <td>Проверка формата URL</td>
            </tr>
            <tr>
              <td>
                <code>.oneOf([...], msg)</code>
              </td>
              <td>Одно из значений</td>
            </tr>
            <tr>
              <td>
                <code>.test(name, msg, fn)</code>
              </td>
              <td>Кастомное правило</td>
            </tr>
            <tr>
              <td>
                <code>.notRequired()</code>
              </td>
              <td>Поле опциональное</td>
            </tr>
            <tr>
              <td>
                <code>.typeError(msg)</code>
              </td>
              <td>Ошибка при неверном типе</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
