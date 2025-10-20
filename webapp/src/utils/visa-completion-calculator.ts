/**
 * Visa type interface for completion date calculation
 */
interface VisaTypeForCalculation {
  processingMode: 'fixed' | 'approximate';
  processingUnit: 'days' | 'hours';
  processingValueFixed: number | null | undefined;
  processingValueMax?: number | null | undefined;
}

/**
 * Получает часовой пояс приложения
 */
function getAppTimezone(): string {
  return import.meta.env.VITE_TIMEZONE || 'Asia/Ho_Chi_Minh';
}

/**
 * Конвертирует дату в часовой пояс приложения
 */
function convertToAppTimezone(date: Date): Date {
  const appTimezone = getAppTimezone();

  // Создаем formatter для получения компонентов даты в нужном часовом поясе
  const formatter = new Intl.DateTimeFormat('sv-SE', {
    timeZone: appTimezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  // Форматируем дату в ISO формат и создаем новую дату
  const formatted = formatter.format(date);
  return new Date(formatted);
}

/**
 * Checks if a date is a weekend (Saturday or Sunday)
 * @param date - The date to check
 * @returns true if the date is Saturday (6) or Sunday (0)
 */
function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6; // Sunday (0) or Saturday (6)
}

/**
 * Adds business days to a date, skipping weekends
 * @param startDate - The starting date
 * @param businessDays - Number of business days to add
 * @returns The date after adding business days
 */
function addBusinessDays(startDate: Date, businessDays: number): Date {
  const result = new Date(startDate);
  let daysAdded = 0;

  while (daysAdded < businessDays) {
    result.setDate(result.getDate() + 1);
    if (!isWeekend(result)) {
      daysAdded++;
    }
  }

  return result;
}

/**
 * Gets the next business day if the current date is a weekend
 * @param date - The date to check
 * @returns The same date if it's a business day, or the next Monday if it's a weekend
 */
function getNextBusinessDay(date: Date): Date {
  const result = new Date(date);

  while (isWeekend(result)) {
    result.setDate(result.getDate() + 1);
  }

  return result;
}

/**
 * Calculates completion time for hour-based visa processing
 * @param startDate - The starting date and time
 * @param processingHours - Number of hours needed for processing
 * @returns The calculated completion date and time
 */
function calculateHourBasedCompletion(startDate: Date, processingHours: number): Date {
  const result = new Date(startDate);
  const currentHour = result.getHours() + result.getMinutes() / 60;

  // 4 hour visa logic
  if (processingHours === 4) {
    if (currentHour <= 8) {
      // Before 8 AM -> ready at 12:00 same day
      result.setHours(12, 0, 0, 0);
      return result;
    } else if (currentHour <= 13) {
      // At or after 8 AM but before 13:00 (1 PM) -> ready at 17:00 same day (4 hours left)
      result.setHours(17, 0, 0, 0);
      return result;
    } else {
      // After 13:00 -> ready at 17:00 next day (not enough time left)
      result.setDate(result.getDate() + 1);
      const nextDay = getNextBusinessDay(result);
      nextDay.setHours(17, 0, 0, 0);
      return nextDay;
    }
  }

  // 2 hour visa logic
  if (processingHours === 2) {
    if (currentHour <= 8) {
      // Before 8 AM -> ready at 10:00
      result.setHours(10, 0, 0, 0);
      return result;
    } else if (currentHour <= 9) {
      // Before 9 AM -> ready at 11:00
      result.setHours(11, 0, 0, 0);
      return result;
    } else if (currentHour <= 10) {
      // Before 10 AM -> ready at 12:00
      result.setHours(12, 0, 0, 0);
      return result;
    } else if (currentHour <= 13.5) {
      // After 10 AM (considering lunch) -> ready at 15:30
      result.setHours(15, 30, 0, 0);
      return result;
    } else if (currentHour <= 14) {
      // Before 14:00 -> ready at 16:00
      result.setHours(16, 0, 0, 0);
      return result;
    } else if (currentHour <= 15) {
      // Before 15:00 -> ready at 17:00
      result.setHours(17, 0, 0, 0);
      return result;
    } else {
      // After 16:00 -> ready at 10:00 next day
      result.setDate(result.getDate() + 1);
      const nextDay = getNextBusinessDay(result);
      nextDay.setHours(10, 0, 0, 0);
      return nextDay;
    }
  }

  // 1 hour visa logic
  if (processingHours === 1) {
    if (currentHour <= 8) {
      // Before 8 AM -> ready at 9:00
      result.setHours(9, 0, 0, 0);
      return result;
    } else if (currentHour <= 9) {
      // Before 9 AM -> ready at 10:00
      result.setHours(10, 0, 0, 0);
      return result;
    } else if (currentHour <= 10) {
      // Before 10 AM -> ready at 11:00
      result.setHours(11, 0, 0, 0);
      return result;
    } else if (currentHour <= 10.5) {
      // Before 10:30 AM -> ready at 11:30
      result.setHours(11, 30, 0, 0);
      return result;
    } else if (currentHour <= 13.5) {
      // After 11 AM (considering lunch) -> ready at 14:30
      result.setHours(14, 30, 0, 0);
      return result;
    } else if (currentHour <= 14) {
      // Before 14:00 -> ready at 15:00
      result.setHours(15, 0, 0, 0);
      return result;
    } else if (currentHour <= 15) {
      // Before 15:00 -> ready at 16:00
      result.setHours(16, 0, 0, 0);
      return result;
    } else if (currentHour <= 16) {
      // Before 16:00 -> ready at 17:00
      result.setHours(17, 0, 0, 0);
      return result;
    } else {
      // After 16:00 -> ready at 9:00 next day
      result.setDate(result.getDate() + 1);
      const nextDay = getNextBusinessDay(result);
      nextDay.setHours(9, 0, 0, 0);
      return nextDay;
    }
  }

  return result;
}

/**
 * Calculates the planned completion date for a visa application
 * @param visaType - The visa type with processing information
 * @param stampUntilDate - The date when client plans to exit the country (used when clientIsInTheCountry === true)
 * @param clientIsInTheCountry - Whether the client is currently in the country
 * @param createdAt - The date when the visa application was created (used when clientIsInTheCountry === false)
 * @returns The calculated completion date or null if cannot be calculated
 */
export function calculatePlannedCompletionDate(
  visaType: VisaTypeForCalculation | null,
  stampUntilDate: Date | null,
  clientIsInTheCountry: boolean
): Date | null {
  if (!visaType) {
    return null;
  }

  // Determine the base date based on client location
  let baseDate: Date | null = null;
  if (clientIsInTheCountry) {
    // For clients in the country, use stampUntilDate
    baseDate = stampUntilDate;
  } else {
    // For clients not in the country, use createdAt
    baseDate = convertToAppTimezone(new Date());
  }

  if (!baseDate) {
    return null;
  }

  // Handle different processing modes based on client location
  if (clientIsInTheCountry) {
    // For clients in the country, only calculate for fixed processing mode
    if (visaType.processingMode !== 'fixed' || !visaType.processingValueFixed) {
      return null;
    }
  } else {
    // For clients not in the country, calculate for both fixed and approximate modes
    if (visaType.processingMode === 'fixed') {
      if (!visaType.processingValueFixed) {
        return null;
      }
    } else if (visaType.processingMode === 'approximate') {
      if (!visaType.processingValueMax) {
        return null;
      }
    } else {
      return null;
    }
  }

  let processDate = new Date(baseDate);

  // ИСПРАВЛЕНИЕ: Если базовая дата - выходной день, переносим на следующий рабочий день
  // но сохраняем оригинальное время
  const originalTime = processDate.getHours() + processDate.getMinutes() / 60;
  if (isWeekend(processDate)) {
    processDate = getNextBusinessDay(processDate);
    // Восстанавливаем оригинальное время
    processDate.setHours(Math.floor(originalTime), (originalTime % 1) * 60, 0, 0);
  }

  const processTime = processDate.getHours() + processDate.getMinutes() / 60;

  if (visaType.processingUnit === 'days') {
    // Determine processing days based on mode and client location
    let processingDays: number;
    if (clientIsInTheCountry || visaType.processingMode === 'fixed') {
      processingDays = visaType.processingValueFixed!;
    } else {
      // For approximate mode when client is not in the country, use maximum value
      processingDays = visaType.processingValueMax!;
    }

    if (processingDays === 1) {
      // For 1 day processing: if process time < 9:00, ready same day at 17:00, otherwise next business day at 17:00
      let completionDate: Date;

      if (processTime <= 9) {
        // Same day completion
        completionDate = new Date(processDate);
        completionDate.setHours(17, 0, 0, 0);
        return completionDate;
      } else {
        // Next business day completion
        completionDate = addBusinessDays(processDate, 1);
        completionDate.setHours(17, 0, 0, 0);
        return completionDate;
      }
    } else if (processingDays > 1) {
      // For >1 day processing (including approximate mode): if submitted before 16:00, first day counts
      let completionDate: Date;

      if (processTime <= 16) {
        // First day counts, so we add (processingDays - 1) business days
        completionDate = addBusinessDays(processDate, processingDays - 1);
      } else {
        // First day doesn't count, so we add full processingDays business days
        completionDate = addBusinessDays(processDate, processingDays);
      }

      completionDate.setHours(17, 0, 0, 0);
      return completionDate;
    }
  } else if (visaType.processingUnit === 'hours') {
    // Determine processing hours based on mode and client location
    let processingHours: number;
    if (clientIsInTheCountry || visaType.processingMode === 'fixed') {
      processingHours = visaType.processingValueFixed!;
    } else {
      // For approximate mode when client is not in the country, use maximum value
      processingHours = visaType.processingValueMax!;
    }

    // For hour-based processing, calculate exact completion time
    const completionDate = calculateHourBasedCompletion(processDate, processingHours);
    return completionDate;
  }

  return null;
}

/**
 * Checks if a visa type should be disabled/inactive
 * @param visaType - The visa type to check
 * @param clientIsInTheCountry - Whether the client is currently in the country
 * @returns true if the visa type should be disabled
 */
export function isVisaTypeDisabled(): boolean {
  // Visa types with approximate processing mode should be inactive ONLY when client is in the country
  // For clients not in the country, approximate processing is allowed
  return false;
}
