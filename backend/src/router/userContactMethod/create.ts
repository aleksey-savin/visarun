import { userUpdateProcedure } from '../../lib/trpc.js';
import { z } from 'zod';

export const zCreateUserContactMethodTrpcInput = z.object({
  userId: z.string().uuid(),
  contactMethodId: z.string().uuid(),
  value: z.string().min(1).max(500),
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

    // Verify contact method exists
    const contactMethod = await ctx.prisma.contactMethod.findUnique({
      where: { id: input.contactMethodId },
    });

    if (!contactMethod) {
      throw new Error('Contact method not found');
    }

    // Check if user already has this contact method assigned
    const existingAssignment = await ctx.prisma.userContactMethod.findUnique({
      where: {
        userId_contactMethodId: {
          userId: input.userId,
          contactMethodId: input.contactMethodId,
        },
      },
    });

    if (existingAssignment) {
      throw new Error('User already has this contact method assigned');
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
        method: userContactMethod.method,
      },
    };
  });
