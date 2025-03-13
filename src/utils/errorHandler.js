/**
 * Creates a standardized error response object
 * @param {string} message - Error message
 * @param {number} statusCode - HTTP status code
 * @param {Object} additionalInfo - Additional error information
 * @returns {Object} Formatted error object
 */
export function createErrorResponse(message, statusCode = 500, additionalInfo = {}) {
  return {
    error: true,
    statusCode,
    message,
    timestamp: new Date().toISOString(),
    ...additionalInfo
  };
}

/**
 * Logs an error with consistent formatting
 * @param {Error} error - The error object
 * @param {string} context - Context where the error occurred
 */
export function logError(error, context = 'Application') {
  console.error(`[${context}] ${new Date().toISOString()} - Error:`, error.message);
  if (error.stack) {
    console.error('Stack trace:', error.stack);
  }
} 