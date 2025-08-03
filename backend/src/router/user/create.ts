import { userCreateProcedure } from '../../lib/trpc.js';
import { createUserWithValidation } from '../../utils/userCreation.js';

import { z } from 'zod';

export const zCreateUserTrpcInput = z
  .object({
    email: z.string().email().optional(),
    firstName: z.string().min(1).max(100),
    lastName: z.string().min(1).max(100),
    middleName: z.string().min(1).max(100).optional(),
    roleIds: z.array(z.string().uuid()).min(1),
    password: z.string().min(8).max(100),
  })
  .refine(
    data => {
      // Must have email when creating via admin interface
      return !!data.email;
    },
    {
      message: 'Email is required when creating users through admin interface',
    }
  );

export const createUserTrpcRoute = userCreateProcedure
  .input(zCreateUserTrpcInput)
  .mutation(async ({ input, ctx }) => {
    // Create user using utility function
    const result = await createUserWithValidation(ctx.prisma, {
      email: input.email!,
      firstName: input.firstName,
      middleName: input.middleName,
      lastName: input.lastName,
      password: input.password,
      mustChangePassword: false, // Admin-created users don't need to change password by default
      isActive: true, // Admin-created users are active by default
      roleIds: input.roleIds,
    });

    return {
      user: {
        id: result.user.id,
        firstName: result.user.firstName,
        middleName: result.user.middleName,
        lastName: result.user.lastName,
        email: result.user.email,
        isActive: result.user.isActive,
        mustChangePassword: result.user.mustChangePassword,
        roles: result.roles,
        contactMethods: result.contactMethods,
      },
    };
  });
