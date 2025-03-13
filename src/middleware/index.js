/**
 * Request timeout middleware
 * @param {number} timeout - Timeout in milliseconds
 * @returns {Function} Express middleware function
 */
export const requestTimeout = (timeout = 60000) => (req, res, next) => {
  req.setTimeout(timeout, () => {
    console.error('Request timeout');
    if (!res.headersSent) {
      res.status(408).json({ 
        error: 'Request Timeout', 
        message: 'The request took too long to process'
      });
    }
  });
  next();
};

/**
 * Logging middleware
 * @returns {Function} Express middleware function
 */
export const requestLogger = () => (req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
};

/**
 * Error handling middleware
 * @param {boolean} isProduction - Whether the app is running in production
 * @returns {Function} Express error handling middleware
 */
export const errorHandler = (isProduction = false) => (err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ 
    error: 'Internal server error', 
    message: isProduction ? 'An unexpected error occurred' : err.message 
  });
}; 