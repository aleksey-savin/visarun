import crypto from 'crypto';

import { trpc } from '../../lib/trpc.ts';
import { UserRole } from '@prisma/client';
import { zCreateUserTrpcInput } from './input.ts';

export const createUserRouter = trpc.procedure
  .input(zCreateUserTrpcInput)
  .mutation(async ({ input, ctx }) => {
    const existingUser = await ctx.prisma.user.findUnique({
      where: { email: input.email },
    });

    if (existingUser) {
      throw new Error('User already exists');
    }

    const hashedPassword = crypto.createHash('sha256').update(input.password).digest('hex');

    const user = await ctx.prisma.user.create({
      data: {
        firstName: input.firstName,
        middleName: input.middleName,
        lastName: input.lastName,
        email: input.email,
        role: input.role as UserRole,
        password: hashedPassword,
      },
    });
    return { user };
  });
