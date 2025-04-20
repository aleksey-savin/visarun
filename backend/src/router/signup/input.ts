import { z } from 'zod';

export const zSignUpTrpcInput = z.object({
  email: z.string().email(),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  middleName: z.string().min(1).max(100).optional(),
  password: z.string().min(8).max(100),
});
