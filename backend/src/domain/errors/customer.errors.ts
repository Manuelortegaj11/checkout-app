import { appError, type AppError } from '@shared/errors/app-error';

/** El mensaje no repite el email: es un dato personal. */
export const invalidEmail = (): AppError =>
  appError('VALIDATION', 'INVALID_EMAIL', 'Invalid email address');
