import { z } from 'zod';

export const contactMethodSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  description: z.string().max(500, 'Description too long').optional(),
  icon: z.string().max(2000, 'Icon too large').optional(),
});

export type ContactMethodFormData = z.infer<typeof contactMethodSchema>;
