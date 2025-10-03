import { z } from 'zod';

/**
 * Trims string inputs before applying downstream validations.
 */
export function trimmedString(message?: string) {
  return z
    .string(message ? { required_error: message } : undefined)
    .trim();
}

export const formErrors = {
  required: (field: string) => `${field} is required`,
  maxLength: (field: string, max: number) => `${field} must be ${max} characters or less`,
};
