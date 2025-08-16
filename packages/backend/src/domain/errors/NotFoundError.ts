export class NotFoundError extends Error {
  constructor(resource: string, id?: string) {
    const message = id 
      ? `${resource} with id ${id} not found`
      : `${resource} not found`;
    super(message);
    this.name = 'NotFoundError';
  }
}