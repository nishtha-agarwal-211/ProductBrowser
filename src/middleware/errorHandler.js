/**
 * Centralized Error Handler Middleware
 * 
 * Catches all errors thrown in route handlers and returns
 * structured JSON error responses with appropriate status codes.
 */

/**
 * Custom application error with status code and error code.
 */
class AppError extends Error {
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.name = 'AppError';
  }
}

/**
 * Express error handling middleware.
 * Must have 4 parameters for Express to recognize it as an error handler.
 */
function errorHandler(err, req, res, _next) {
  // Log the error for debugging
  if (process.env.NODE_ENV !== 'test') {
    console.error(`[ERROR] ${err.code || 'UNKNOWN'}: ${err.message}`);
    if (err.stack && process.env.NODE_ENV === 'development') {
      console.error(err.stack);
    }
  }

  // Handle known application errors
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      error: err.message,
      code: err.code,
      statusCode: err.statusCode,
    });
  }

  // Handle PostgreSQL-specific errors
  if (err.code === '23505') {
    return res.status(409).json({
      success: false,
      error: 'Duplicate entry',
      code: 'DUPLICATE_ENTRY',
      statusCode: 409,
    });
  }

  if (err.code === '23514') {
    return res.status(400).json({
      success: false,
      error: 'Data validation failed',
      code: 'VALIDATION_ERROR',
      statusCode: 400,
    });
  }

  // Handle query timeouts
  if (err.code === '57014') {
    return res.status(504).json({
      success: false,
      error: 'Query timed out',
      code: 'QUERY_TIMEOUT',
      statusCode: 504,
    });
  }

  // Generic internal server error (don't leak details in production)
  return res.status(500).json({
    success: false,
    error: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : err.message,
    code: 'INTERNAL_ERROR',
    statusCode: 500,
  });
}

module.exports = { errorHandler, AppError };
