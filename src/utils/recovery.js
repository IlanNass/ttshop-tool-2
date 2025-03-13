/**
 * Creates a placeholder shop object with error information
 * @param {string} url - The shop URL that failed to scrape
 * @param {Error} error - The error that occurred
 * @returns {Object} A placeholder data object for the UI
 */
export function createFallbackResponse(url, error) {
  return {
    shopName: 'Temporarily Unavailable',
    message: 'The shop data could not be retrieved at this time.',
    errorCode: error?.message || 'Unknown error',
    url: url || 'No URL provided', 
    timestamp: new Date().toISOString(),
    isPlaceholder: true
  };
} 