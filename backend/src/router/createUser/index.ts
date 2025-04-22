import { trpc } from '../../lib/trpc.js';
import { UserRole } from '@prisma/client';
import { zCreateUserTrpcInput } from './input.js';
import { hashPassword } from '../../utils/getPasswordHash.js';

export const createUserRouter = trpc.procedure
  .input(zCreateUserTrpcInput)
  .mutation(async ({ input, ctx }) => {
    const existingUser = await ctx.prisma.user.findUnique({
      where: { email: input.email },
    });

    if (existingUser) {
      throw new Error('User already exists');
    }

    // Use the same password hashing function that's used for verification
    const hashedPassword = await hashPassword(input.password);

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

    return {
      user: {
        id: user.id,
        firstName: user.firstName,
        middleName: user.middleName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
      },
    };
  });
