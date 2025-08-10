import { userUpdateProcedure } from '../../lib/trpc.js';
import { z } from 'zod';

export const zCreateUserContactMethodTrpcInput = z.object({
  userId: z.string().uuid(),
  contactMethodId: z.string().uuid().optional(),
  value: z.string().max(500),
  url: z.string().url().optional(),
});

export const createUserContactMethodTrpcRoute = userUpdateProcedure
  .input(zCreateUserContactMethodTrpcInput)
  .mutation(async ({ input, ctx }) => {
    // Verify user exists
    const user = await ctx.prisma.user.findUnique({
      where: { id: input.userId },
    });

    if (!user) {
      throw new Error('User not found');
    }

    const userContactMethod = await ctx.prisma.userContactMethod.create({
      data: {
        userId: input.userId,
        contactMethodId: input.contactMethodId,
        value: input.value,
        url: input.url,
      },
      include: {
        method: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
      },
    });

    return {
      userContactMethod: {
        id: userContactMethod.id,
        userId: userContactMethod.userId,
        contactMethodId: userContactMethod.contactMethodId,
        value: userContactMethod.value,
        url: userContactMethod.url,
        createdAt: userContactMethod.createdAt,
        updatedAt: userContactMethod.updatedAt,
        method: userContactMethod ? userContactMethod.method : null,
      },
    };
  });
