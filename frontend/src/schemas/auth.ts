import { z } from 'zod';
import { toTypedSchema } from '@vee-validate/zod';

const identifierField = z
  .string()
  .min(1, 'Email or phone is required')
  .refine(
    (val) =>
      z.string().email().safeParse(val).success || /^\+?[1-9]\d{1,14}$/.test(val),
    'Please enter a valid email address or phone number',
  );

export const loginSchema = toTypedSchema(
  z.object({
    identifier: identifierField,
    password: z
      .string()
      .min(1, 'Password is required'),
  }),
);

export const registerSchema = toTypedSchema(
  z.object({
    identifier: identifierField,
    password: z
      .string()
      .min(6, 'Password must be at least 6 characters'),
  }),
);
