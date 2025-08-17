export class UnauthorizedError extends Error {
  constructor(action: string, resource?: string) {
    const message = resource
      ? `You are not authorized to ${action} this ${resource}`
      : `You are not authorized to ${action}`;
    super(message);
    this.name = 'UnauthorizedError';
  }
}