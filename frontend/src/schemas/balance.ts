import { z } from 'zod';
import { toTypedSchema } from '@vee-validate/zod';

export const balanceSchema = toTypedSchema(
  z.object({
    visits: z
      .number({ required_error: 'Number of visits is required' })
      .int()
      .min(1, 'Must be at least 1 visit')
      .max(100, 'Cannot exceed 100 visits'),
    dueDate: z.date({ required_error: 'Expiration date is required' }),
    price: z.number().min(0).nullable().optional(),
    notes: z.string().max(200).optional(),
  }),
);
