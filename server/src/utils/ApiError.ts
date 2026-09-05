/** Error type carrying an HTTP status code, thrown from controllers/services. */
export class ApiError extends Error {
  readonly statusCode: number
  readonly details?: unknown

  constructor(statusCode: number, message: string, details?: unknown) {
    super(message)
    this.name = 'ApiError'
    this.statusCode = statusCode
    this.details = details
    Error.captureStackTrace?.(this, ApiError)
  }

  static badRequest(message = 'Bad request', details?: unknown) {
    return new ApiError(400, message, details)
  }

  static notFound(message = 'Resource not found') {
    return new ApiError(404, message)
  }

  static internal(message = 'Internal server error') {
    return new ApiError(500, message)
  }
}
