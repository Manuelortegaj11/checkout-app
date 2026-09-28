import { appError, type AppError } from '@shared/errors/app-error';

export const invalidEmail = (): AppError =>
  appError('VALIDATION', 'INVALID_EMAIL', 'Invalid email address');
