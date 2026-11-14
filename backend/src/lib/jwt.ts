// Centralized JWT configuration and secret validation

if (process.env.NODE_ENV !== 'test' && !process.env.JWT_SECRET) {
  throw new Error('FATAL: JWT_SECRET environment variable must be set in non-test environments');
}

export const JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret-only-for-automated-tests';

export const getJwtSecret = (): string => JWT_SECRET;
