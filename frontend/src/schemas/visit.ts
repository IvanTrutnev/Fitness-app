import { z } from 'zod';
import { toTypedSchema } from '@vee-validate/zod';

export const visitSchema = toTypedSchema(
  z.object({
    userId: z.string().min(1, 'User is required'),
    trainerId: z.string().optional(),
    date: z.date({ required_error: 'Date is required' }),
    price: z.number().min(0).nullable().optional(),
    notes: z.string().max(500).optional(),
    useBalance: z.boolean().default(false),
  }),
);
