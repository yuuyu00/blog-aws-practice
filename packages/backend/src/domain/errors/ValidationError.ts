export class ValidationError extends Error {
  constructor(field: string, reason: string) {
    super(`Validation failed for ${field}: ${reason}`);
    this.name = 'ValidationError';
  }
}