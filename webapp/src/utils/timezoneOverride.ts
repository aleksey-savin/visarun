/**
 * Безопасное переопределение часового пояса для приложения
 * Этот подход не ломает библиотеки типа react-day-picker
 */

// Сохраняем оригинальные методы
const originalDateToLocaleString = Date.prototype.toLocaleString;
const originalDateToLocaleDateString = Date.prototype.toLocaleDateString;
const originalDateToLocaleTimeString = Date.prototype.toLocaleTimeString;
const originalDateTimeFormat = Intl.DateTimeFormat;

// Флаг для управления переопределением
let isOverrideActive = true;

// Список библиотек/компонентов, которые должны быть исключены из переопределения
const exemptPatterns = ['react-day-picker', 'calendar', 'datepicker', 'DayPicker', 'Calendar'];

// Получаем часовой пояс приложения
const getAppTimezone = (): string => {
  return import.meta.env.VITE_TIMEZONE || 'Asia/Ho_Chi_Minh';
};

/**
 * Проверяет, нужно ли применять переопределение часового пояса
 */
const shouldApplyOverride = (): boolean => {
  if (!isOverrideActive) return false;

  // Проверяем стек вызовов на наличие исключенных компонентов
  const stack = new Error().stack || '';
  return !exemptPatterns.some(pattern => stack.includes(pattern));
};

/**
 * Безопасно применяет часовой пояс к опциям форматирования
 */
const applyTimezoneToOptions = (
  options?: Intl.DateTimeFormatOptions
): Intl.DateTimeFormatOptions => {
  if (!shouldApplyOverride()) {
    return options || {};
  }

  const appTimezone = getAppTimezone();
  return {
    ...options,
    timeZone: appTimezone,
  };
};

/**
 * Создает безопасный Intl.DateTimeFormat с переопределением часового пояса
 */
class SafeDateTimeFormat {
  private formatter: Intl.DateTimeFormat;

  constructor(locales?: string | string[], options?: Intl.DateTimeFormatOptions) {
    const safeOptions = applyTimezoneToOptions(options);
    this.formatter = new originalDateTimeFormat(locales, safeOptions);
  }

  format(date: Date): string {
    return this.formatter.format(date);
  }

  formatToParts(date: Date): Intl.DateTimeFormatPart[] {
    return this.formatter.formatToParts(date);
  }

  formatRange(startDate: Date, endDate: Date): string {
    if ('formatRange' in this.formatter) {
      return (this.formatter as any).formatRange(startDate, endDate);
    }
    return `${this.formatter.format(startDate)} – ${this.formatter.format(endDate)}`;
  }

  formatRangeToParts(startDate: Date, endDate: Date): Intl.DateTimeFormatPart[] {
    if ('formatRangeToParts' in this.formatter) {
      return (this.formatter as any).formatRangeToParts(startDate, endDate);
    }
    return [...this.formatter.formatToParts(startDate), ...this.formatter.formatToParts(endDate)];
  }

  resolvedOptions(): Intl.ResolvedDateTimeFormatOptions {
    return this.formatter.resolvedOptions();
  }

  static supportedLocalesOf(
    locales: string | string[],
    options?: Intl.DateTimeFormatOptions
  ): string[] {
    return originalDateTimeFormat.supportedLocalesOf(locales, options);
  }
}

/**
 * Инициализирует безопасное переопределение часового пояса
 */
export const initTimezoneOverride = (): void => {
  const appTimezone = getAppTimezone();
  console.log(`🌍 Инициализация переопределения часового пояса: ${appTimezone}`);

  // Переопределяем только методы форматирования строк
  Date.prototype.toLocaleString = function (
    this: Date,
    locales?: string | string[],
    options?: Intl.DateTimeFormatOptions
  ): string {
    const safeOptions = applyTimezoneToOptions(options);
    return originalDateToLocaleString.call(this, locales, safeOptions);
  };

  Date.prototype.toLocaleDateString = function (
    this: Date,
    locales?: string | string[],
    options?: Intl.DateTimeFormatOptions
  ): string {
    const safeOptions = applyTimezoneToOptions(options);
    return originalDateToLocaleDateString.call(this, locales, safeOptions);
  };

  Date.prototype.toLocaleTimeString = function (
    this: Date,
    locales?: string | string[],
    options?: Intl.DateTimeFormatOptions
  ): string {
    const safeOptions = applyTimezoneToOptions(options);
    return originalDateToLocaleTimeString.call(this, locales, safeOptions);
  };

  // Переопределяем Intl.DateTimeFormat более безопасно
  const DateTimeFormatConstructor = function (
    this: Intl.DateTimeFormat,
    locales?: string | string[],
    options?: Intl.DateTimeFormatOptions
  ) {
    // Если вызван с new, создаем экземпляр SafeDateTimeFormat
    if (new.target) {
      return new SafeDateTimeFormat(locales, options);
    }
    // Если вызван как функция, также создаем экземпляр
    return new SafeDateTimeFormat(locales, options);
  };

  // Копируем статические методы
  Object.setPrototypeOf(DateTimeFormatConstructor, originalDateTimeFormat);
  DateTimeFormatConstructor.prototype = originalDateTimeFormat.prototype;
  DateTimeFormatConstructor.supportedLocalesOf = originalDateTimeFormat.supportedLocalesOf;

  // Заменяем конструктор
  (Intl as { DateTimeFormat: typeof Intl.DateTimeFormat }).DateTimeFormat =
    DateTimeFormatConstructor as any;
};

/**
 * Временно отключает переопределение часового пояса
 */
export const disableTimezoneOverride = (): void => {
  isOverrideActive = false;
};

/**
 * Включает переопределение часового пояса
 */
export const enableTimezoneOverride = (): void => {
  isOverrideActive = true;
};

/**
 * Выполняет функцию без переопределения часового пояса
 */
export const withoutTimezoneOverride = <T>(fn: () => T): T => {
  const wasActive = isOverrideActive;
  disableTimezoneOverride();
  try {
    return fn();
  } finally {
    if (wasActive) {
      enableTimezoneOverride();
    }
  }
};

/**
 * Добавляет паттерн в список исключений
 */
export const addTimezoneExemption = (pattern: string): void => {
  if (!exemptPatterns.includes(pattern)) {
    exemptPatterns.push(pattern);
  }
};

/**
 * Удаляет паттерн из списка исключений
 */
export const removeTimezoneExemption = (pattern: string): void => {
  const index = exemptPatterns.indexOf(pattern);
  if (index > -1) {
    exemptPatterns.splice(index, 1);
  }
};

/**
 * Создает дату в указанном часовом поясе
 */
export const createDateInTimezone = (date: Date, timezone?: string): Date => {
  const targetTimezone = timezone || getAppTimezone();
  const formatter = new originalDateTimeFormat('sv-SE', {
    timeZone: targetTimezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  const formatted = formatter.format(date);
  return new Date(formatted);
};

/**
 * Форматирует дату с учетом часового пояса приложения
 */
export const formatDateInTimezone = (
  date: Date,
  locales?: string | string[],
  options?: Intl.DateTimeFormatOptions
): string => {
  const appTimezone = getAppTimezone();
  const newOptions = {
    ...options,
    timeZone: appTimezone,
  };
  return originalDateToLocaleString.call(date, locales, newOptions);
};

/**
 * Восстанавливает оригинальное поведение часового пояса
 */
export const restoreOriginalTimezone = (): void => {
  Date.prototype.toLocaleString = originalDateToLocaleString;
  Date.prototype.toLocaleDateString = originalDateToLocaleDateString;
  Date.prototype.toLocaleTimeString = originalDateToLocaleTimeString;
  (Intl as { DateTimeFormat: typeof Intl.DateTimeFormat }).DateTimeFormat = originalDateTimeFormat;
  isOverrideActive = false;
};
