/**
 * Input Validation Utilities
 * Validates API request parameters before processing
 * Prevents invalid queries from reaching the database layer
 */

class ValidationUtils {
  /**
   * Validate userId format
   * Expected format: U followed by 3 digits (e.g., U001)
   * @param {string} userId - User ID to validate
   * @returns {Object} { isValid: boolean, error?: string }
   */
  static validateUserId(userId) {
    if (!userId) {
      return {
        isValid: false,
        error: 'userId is required',
      };
    }

    if (typeof userId !== 'string') {
      return {
        isValid: false,
        error: 'userId must be a string',
      };
    }

    if (!/^U\d{3}$/.test(userId)) {
      return {
        isValid: false,
        error: 'userId must be in format U001-U999 (e.g., U001)',
      };
    }

    return { isValid: true };
  }

  /**
   * Validate year for financial queries
   * @param {string|number} year - Year to validate
   * @returns {Object} { isValid: boolean, error?: string, year?: number }
   */
  static validateYear(year) {
    if (!year) {
      // Default to current year
      return { isValid: true, year: new Date().getFullYear() };
    }

    const numYear = parseInt(year, 10);

    if (isNaN(numYear)) {
      return {
        isValid: false,
        error: 'year must be a valid number',
      };
    }

    if (numYear < 2000 || numYear > 2099) {
      return {
        isValid: false,
        error: 'year must be between 2000 and 2099',
      };
    }

    return { isValid: true, year: numYear };
  }

  /**
   * Validate date string in ISO format (YYYY-MM-DD)
   * @param {string} dateString - Date string to validate
   * @param {string} fieldName - Name of field (for error messages)
   * @returns {Object} { isValid: boolean, error?: string, date?: Date }
   */
  static validateDateString(dateString, fieldName = 'date') {
    if (!dateString) {
      return {
        isValid: false,
        error: `${fieldName} is required`,
      };
    }

    // Check format YYYY-MM-DD
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      return {
        isValid: false,
        error: `${fieldName} must be in ISO format (YYYY-MM-DD)`,
      };
    }

    const date = new Date(dateString);

    // Check if date is valid
    if (isNaN(date.getTime())) {
      return {
        isValid: false,
        error: `${fieldName} is not a valid date`,
      };
    }

    return { isValid: true, date };
  }

  /**
   * Validate date range
   * Ensures startDate < endDate
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @returns {Object} { isValid: boolean, error?: string }
   */
  static validateDateRange(startDate, endDate) {
    if (!startDate || !endDate) {
      return {
        isValid: false,
        error: 'Both startDate and endDate are required',
      };
    }

    if (startDate > endDate) {
      return {
        isValid: false,
        error: 'startDate cannot be after endDate',
      };
    }

    // Check if range is reasonable (not more than 10 years)
    const maxRangeMs = 10 * 365 * 24 * 60 * 60 * 1000;
    if (endDate.getTime() - startDate.getTime() > maxRangeMs) {
      return {
        isValid: false,
        error: 'Date range cannot exceed 10 years',
      };
    }

    return { isValid: true };
  }

  /**
   * Validate pagination parameters
   * @param {string|number} limit - Items per page
   * @param {string|number} offset - Offset for pagination
   * @returns {Object} { isValid: boolean, error?: string, limit?: number, offset?: number }
   */
  static validatePagination(limit, offset) {
    const parsedLimit = parseInt(limit, 10) || 10;
    const parsedOffset = parseInt(offset, 10) || 0;

    if (parsedLimit < 1 || parsedLimit > 100) {
      return {
        isValid: false,
        error: 'limit must be between 1 and 100',
      };
    }

    if (parsedOffset < 0) {
      return {
        isValid: false,
        error: 'offset must be greater than or equal to 0',
      };
    }

    return { isValid: true, limit: parsedLimit, offset: parsedOffset };
  }

  /**
   * Validate groupBy parameter for spending trends
   * @param {string} groupBy - Grouping type (daily, weekly, monthly)
   * @returns {Object} { isValid: boolean, error?: string }
   */
  static validateGroupBy(groupBy) {
    const validGroups = ['daily', 'weekly', 'monthly'];

    if (!groupBy) {
      return { isValid: true, groupBy: 'daily' };
    }

    if (!validGroups.includes(groupBy.toLowerCase())) {
      return {
        isValid: false,
        error: `groupBy must be one of: ${validGroups.join(', ')}`,
      };
    }

    return { isValid: true, groupBy: groupBy.toLowerCase() };
  }

  /**
   * Validate all query parameters for analytics endpoints
   * Returns object with validation results and parsed values
   * @param {Object} params - Query/path parameters
   * @param {string} type - Type of validation (monthly, category, summary, trend)
   * @returns {Object} Validation results
   */
  static validateAnalyticsParams(params, type) {
    const errors = [];
    const validated = {};

    // All types need userId
    const userIdValidation = this.validateUserId(params.userId);
    if (!userIdValidation.isValid) {
      errors.push(userIdValidation.error);
    } else {
      validated.userId = params.userId;
    }

    // Monthly spending needs year
    if (type === 'monthly') {
      const yearValidation = this.validateYear(params.year);
      if (!yearValidation.isValid) {
        errors.push(yearValidation.error);
      } else {
        validated.year = yearValidation.year;
      }
    }

    // Category, summary, and trend need date range
    if (['category', 'summary', 'trend'].includes(type)) {
      const startDateValidation = this.validateDateString(
        params.startDate,
        'startDate'
      );
      const endDateValidation = this.validateDateString(
        params.endDate,
        'endDate'
      );

      if (!startDateValidation.isValid) {
        errors.push(startDateValidation.error);
      }
      if (!endDateValidation.isValid) {
        errors.push(endDateValidation.error);
      }

      if (startDateValidation.isValid && endDateValidation.isValid) {
        const rangeValidation = this.validateDateRange(
          startDateValidation.date,
          endDateValidation.date
        );
        if (!rangeValidation.isValid) {
          errors.push(rangeValidation.error);
        } else {
          validated.startDate = startDateValidation.date;
          validated.endDate = endDateValidation.date;
        }
      }
    }

    // Trend needs groupBy
    if (type === 'trend') {
      const groupByValidation = this.validateGroupBy(params.groupBy);
      if (!groupByValidation.isValid) {
        errors.push(groupByValidation.error);
      } else {
        validated.groupBy = groupByValidation.groupBy;
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      data: validated,
    };
  }
}

module.exports = ValidationUtils;
