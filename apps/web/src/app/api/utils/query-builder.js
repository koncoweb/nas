/**
 * Utility functions for building safe SQL queries with proper parameter indexing
 */

export class QueryBuilder {
  constructor() {
    this.params = [];
    this.paramIndex = 1;
  }

  /**
   * Add a parameter and return the placeholder
   * @param {any} value - The parameter value
   * @returns {string} - The parameter placeholder (e.g., "$1")
   */
  addParam(value) {
    this.params.push(value);
    return `$${this.paramIndex++}`;
  }

  /**
   * Add multiple parameters and return placeholders
   * @param {any[]} values - Array of parameter values
   * @returns {string[]} - Array of parameter placeholders
   */
  addParams(values) {
    return values.map(value => this.addParam(value));
  }

  /**
   * Build a LIKE condition for search
   * @param {string} field - The field to search
   * @param {string} searchTerm - The search term
   * @returns {string} - The LIKE condition
   */
  buildLikeCondition(field, searchTerm) {
    const placeholder = this.addParam(`%${searchTerm}%`);
    return `LOWER(${field}) LIKE LOWER(${placeholder})`;
  }

  /**
   * Build multiple LIKE conditions with OR
   * @param {string[]} fields - Array of fields to search
   * @param {string} searchTerm - The search term
   * @returns {string} - The combined LIKE conditions
   */
  buildMultiLikeCondition(fields, searchTerm) {
    const conditions = fields.map(field => this.buildLikeCondition(field, searchTerm));
    return `(${conditions.join(' OR ')})`;
  }

  /**
   * Build an equality condition
   * @param {string} field - The field name
   * @param {any} value - The value to compare
   * @returns {string} - The equality condition
   */
  buildEqualityCondition(field, value) {
    const placeholder = this.addParam(value);
    return `${field} = ${placeholder}`;
  }

  /**
   * Build pagination LIMIT and OFFSET
   * @param {number} limit - The limit value
   * @param {number} offset - The offset value
   * @returns {string} - The LIMIT OFFSET clause
   */
  buildPagination(limit, offset) {
    const limitPlaceholder = this.addParam(limit);
    const offsetPlaceholder = this.addParam(offset);
    return `LIMIT ${limitPlaceholder} OFFSET ${offsetPlaceholder}`;
  }

  /**
   * Get all parameters
   * @returns {any[]} - Array of parameters
   */
  getParams() {
    return this.params;
  }

  /**
   * Reset the builder
   */
  reset() {
    this.params = [];
    this.paramIndex = 1;
  }
}

/**
 * Validate and sanitize numeric input
 * @param {any} value - The input value
 * @param {number} min - Minimum allowed value (default: 0)
 * @param {number} max - Maximum allowed value (default: Number.MAX_SAFE_INTEGER)
 * @returns {number} - The validated number
 */
export function validateNumeric(value, min = 0, max = Number.MAX_SAFE_INTEGER) {
  const num = parseFloat(value);
  if (isNaN(num)) return min;
  return Math.max(min, Math.min(max, num));
}

/**
 * Validate and sanitize integer input
 * @param {any} value - The input value
 * @param {number} min - Minimum allowed value (default: 1)
 * @param {number} max - Maximum allowed value (default: Number.MAX_SAFE_INTEGER)
 * @returns {number} - The validated integer
 */
export function validateInteger(value, min = 1, max = Number.MAX_SAFE_INTEGER) {
  const num = parseInt(value);
  if (isNaN(num) || num < min) return min;
  return Math.min(num, max);
}

/**
 * Validate pagination parameters
 * @param {any} page - The page number
 * @param {any} limit - The limit per page
 * @returns {object} - Validated pagination object
 */
export function validatePagination(page, limit) {
  const validPage = validateInteger(page, 1);
  const validLimit = validateInteger(limit, 1, 100);
  const offset = (validPage - 1) * validLimit;
  
  return {
    page: validPage,
    limit: validLimit,
    offset
  };
}

/**
 * Standardize error responses
 * @param {string} message - Error message
 * @param {number} status - HTTP status code
 * @returns {Response} - JSON error response
 */
export function errorResponse(message, status = 500) {
  return Response.json({ error: message }, { status });
}

/**
 * Standardize success responses
 * @param {any} data - Response data
 * @param {string} message - Success message
 * @param {number} status - HTTP status code
 * @returns {Response} - JSON success response
 */
export function successResponse(data, message = null, status = 200) {
  const response = { ...data };
  if (message) response.message = message;
  return Response.json(response, { status });
}