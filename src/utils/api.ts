/**
 * Утилиты-заглушки (mock API)
 * Имитируют реальные серверные запросы с задержкой
 */

// Имитация задержки сети
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ===== Типы =====
export interface User {
  id: number;
  name: string;
  email: string;
  role: string;
}

export interface Todo {
  id: number;
  text: string;
  completed: boolean;
}

export interface Message {
  id: number;
  text: string;
  author: string;
  timestamp: number;
  sending?: boolean; // флаг оптимистичного обновления
}

// ===== Mock данные =====
const MOCK_USERS: User[] = [
  { id: 1, name: "Алексей Иванов", email: "alex@example.com", role: "developer" },
  { id: 2, name: "Мария Петрова", email: "maria@example.com", role: "designer" },
  { id: 3, name: "Дмитрий Сидоров", email: "dmitry@example.com", role: "manager" },
];

const MOCK_TODOS: Todo[] = [
  { id: 1, text: "Изучить React 19", completed: true },
  { id: 2, text: "Разобрать новые хуки", completed: false },
  { id: 3, text: "Попрактиковаться с формами", completed: false },
  { id: 4, text: "Написать тесты", completed: false },
];

// Большой список для демо useTransition (тяжёлая фильтрация)
export const CITIES: string[] = [
  "Москва",
  "Санкт-Петербург",
  "Новосибирск",
  "Екатеринбург",
  "Казань",
  "Нижний Новгород",
  "Челябинск",
  "Самара",
  "Омск",
  "Ростов-на-Дону",
  "Уфа",
  "Красноярск",
  "Воронеж",
  "Пермь",
  "Волгоград",
  "Краснодар",
  "Саратов",
  "Тюмень",
  "Тольятти",
  "Ижевск",
  "Барнаул",
  "Ульяновск",
  "Иркутск",
  "Хабаровск",
  "Ярославль",
  "Владивосток",
  "Махачкала",
  "Томск",
  "Оренбург",
  "Кемерово",
  "Новокузнецк",
  "Рязань",
  "Астрахань",
  "Пенза",
  "Липецк",
  "Тула",
  "Киров",
  "Чебоксары",
  "Калининград",
  "Брянск",
  "Курск",
  "Иваново",
  "Магнитогорск",
  "Улан-Удэ",
  "Тверь",
  "Ставрополь",
  "Белгород",
  "Сочи",
  "Нижний Тагил",
  "Архангельск",
];

// ===== Mock API функции =====

/**
 * Получить пользователя по ID
 * Имитирует fetch с задержкой 1с
 */
export async function fetchUser(id: number): Promise<User> {
  await delay(1000);
  const user = MOCK_USERS.find((u) => u.id === id);
  if (!user) throw new Error(`User ${id} not found`);
  return user;
}

/**
 * Получить список пользователей
 */
export async function fetchUsers(): Promise<User[]> {
  await delay(5000);
  return [...MOCK_USERS];
}

/**
 * Сохранить пользователя (имитация POST)
 * Может случайно "упасть" для демо обработки ошибок
 */
export async function saveUser(data: { name: string; email: string }): Promise<User> {
  await delay(1500);

  // 10% шанс ошибки для демо
  if (Math.random() < 0.1) {
    throw new Error("Ошибка сервера: не удалось сохранить");
  }

  return {
    id: Date.now(),
    name: data.name,
    email: data.email,
    role: "user",
  };
}

/**
 * Получить список задач
 */
export async function fetchTodos(): Promise<Todo[]> {
  await delay(600);
  return [...MOCK_TODOS];
}

/**
 * Переключить статус задачи
 */
export async function toggleTodo(id: number): Promise<Todo> {
  await delay(800);
  const todo = MOCK_TODOS.find((t) => t.id === id);
  if (!todo) throw new Error(`Todo ${id} not found`);
  return { ...todo, completed: !todo.completed };
}

/**
 * Отправить сообщение (для демо useOptimistic)
 */
export async function sendMessage(text: string): Promise<Message> {
  await delay(1200);

  // 15% шанс ошибки для демо отката оптимистичного обновления
  if (Math.random() < 0.15) {
    throw new Error("Не удалось отправить сообщение");
  }

  return {
    id: Date.now(),
    text,
    author: "Вы",
    timestamp: Date.now(),
  };
}

/**
 * Аутентификация (для демо форм)
 */
export async function loginUser(email: string, password: string): Promise<{ token: string }> {
  await delay(1000);

  if (email === "test@test.com" && password === "password123") {
    return { token: "mock-jwt-token-12345" };
  }

  throw new Error("Неверный email или пароль");
}

/**
 * Регистрация (для демо форм)
 */
export async function registerUser(data: { name: string; email: string; password: string }): Promise<User> {
  await delay(1500);

  // Проверяем "занятый" email
  if (data.email === "taken@example.com") {
    throw new Error("Этот email уже занят");
  }

  return {
    id: Date.now(),
    name: data.name,
    email: data.email,
    role: "user",
  };
}

/**
 * Тяжёлая операция фильтрации (для демо useTransition)
 * Искусственно замедлена для наглядности
 */
export function heavyFilter(items: string[], query: string): string[] {
  // Имитация тяжёлых вычислений
  const start = performance.now();
  while (performance.now() - start < 100) {
    // Блокируем поток на 100мс для наглядности
  }

  if (!query.trim()) return items;
  return items.filter((item) => item.toLowerCase().includes(query.toLowerCase()));
}
