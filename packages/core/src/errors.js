export class AppError extends Error {
  constructor(message, statusCode = 400, code = 'BAD_REQUEST') {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
  }
}

export function asAppError(error) {
  if (error instanceof AppError) {
    return error;
  }

  return new AppError('Internal server error', 500, 'INTERNAL_SERVER_ERROR');
}
