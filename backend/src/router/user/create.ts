import { adminProcedure } from '../../lib/trpc.js';
import { hashPassword } from '../../utils/getPasswordHash.js';

import { z } from 'zod';

export const zCreateUserTrpcInput = z.object({
  email: z.string().email(),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  middleName: z.string().min(1).max(100).optional(),
  roleId: z.string().uuid(),
  password: z.string().min(8).max(100),
});

export const createUserTrpcRoute = adminProcedure
  .input(zCreateUserTrpcInput)
  .mutation(async ({ input, ctx }) => {
    const existingUser = await ctx.prisma.user.findUnique({
      where: { email: input.email },
    });

    if (existingUser) {
      throw new Error('User already exists');
    }

    const role = await ctx.prisma.role.findUnique({
      where: { id: input.roleId },
    });

    if (!role) {
      throw new Error('Selected role does not exist');
    }

    // Use the same password hashing function that's used for verification
    const hashedPassword = await hashPassword(input.password);

    const user = await ctx.prisma.user.create({
      data: {
        firstName: input.firstName,
        middleName: input.middleName,
        lastName: input.lastName,
        email: input.email,
        roleId: input.roleId,
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
        roleId: user.roleId,
      },
    };
  });
