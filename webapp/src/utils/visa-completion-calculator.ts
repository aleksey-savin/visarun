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
 * Calculates the planned completion date for a visa application
 * @param visaType - The visa type with processing information
 * @param plannedCountryExitDate - The date when client plans to exit the country (used when clientIsInTheCountry === true)
 * @param clientIsInTheCountry - Whether the client is currently in the country
 * @param createdAt - The date when the visa application was created (used when clientIsInTheCountry === false)
 * @returns The calculated completion date or null if cannot be calculated
 */
export function calculatePlannedCompletionDate(
  visaType: VisaTypeForCalculation | null,
  plannedCountryExitDate: Date | null,
  clientIsInTheCountry: boolean,
  createdAt?: Date | null
): Date | null {
  if (!visaType) {
    return null;
  }

  // Determine the base date based on client location
  let baseDate: Date | null = null;
  if (clientIsInTheCountry) {
    // For clients in the country, use plannedCountryExitDate
    baseDate = plannedCountryExitDate;
  } else {
    // For clients not in the country, use createdAt
    baseDate = createdAt || null;
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

  const processDate = new Date(baseDate);
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

      if (processTime < 9) {
        completionDate = new Date(processDate);
      } else {
        completionDate = addBusinessDays(processDate, 1);
      }

      // Ensure completion date is a business day
      completionDate = getNextBusinessDay(completionDate);
      completionDate.setHours(17, 0, 0, 0);
      return completionDate;
    } else if (processingDays > 1) {
      // For >1 day processing (including approximate mode): if submitted before 16:00, first day counts
      let completionDate: Date;

      if (processTime < 16) {
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
    // For hours processing: if process time < 9:00, ready same day at 17:00, otherwise next business day at 17:00
    // For approximate mode with hours, we still follow the same logic but use max value for estimation
    let completionDate: Date;

    if (processTime < 9) {
      completionDate = new Date(processDate);
    } else {
      completionDate = addBusinessDays(processDate, 1);
    }

    // Ensure completion date is a business day
    completionDate = getNextBusinessDay(completionDate);
    completionDate.setHours(17, 0, 0, 0);
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
export function isVisaTypeDisabled(
  visaType: VisaTypeForCalculation,
  clientIsInTheCountry: boolean
): boolean {
  // Visa types with approximate processing mode should be inactive ONLY when client is in the country
  // For clients not in the country, approximate processing is allowed
  return clientIsInTheCountry && visaType.processingMode === 'approximate';
}
