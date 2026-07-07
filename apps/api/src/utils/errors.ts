export class AppError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode: number = 500,
    public details?: unknown
  ) {
    super(message);
    this.name = "AppError";
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: unknown) {
    super("VALIDATION_ERROR", message, 400, details);
    this.name = "ValidationError";
  }
}

export class CSVParserError extends AppError {
  constructor(message: string, details?: unknown) {
    super("CSV_PARSE_ERROR", message, 422, details);
    this.name = "CSVParserError";
  }
}

export class AIServiceError extends AppError {
  constructor(message: string, details?: unknown) {
    super("AI_SERVICE_ERROR", message, 502, details);
    this.name = "AIServiceError";
  }
}

export class NotFoundError extends AppError {
  constructor(message: string) {
    super("NOT_FOUND", message, 404);
    this.name = "NotFoundError";
  }
}
