export class BusinessRuleViolationError extends Error {
  constructor(rule: string) {
    super(`Business rule violation: ${rule}`);
    this.name = 'BusinessRuleViolationError';
  }
}