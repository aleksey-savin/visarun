import { userUpdateProcedure } from '../../lib/trpc.js';
import { z } from 'zod';
import { Prisma } from '@prisma/client';

export const zEditUserContactMethodTrpcInput = z.object({
  id: z.string().uuid(),
  value: z.string().min(1).max(500).optional(),
  url: z.string().url().optional(),
});

export const editUserContactMethodTrpcRoute = userUpdateProcedure
  .input(zEditUserContactMethodTrpcInput)
  .mutation(async ({ input, ctx }) => {
    // Verify user contact method exists
    const existingUserContactMethod = await ctx.prisma.userContactMethod.findUnique({
      where: { id: input.id },
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

    if (!existingUserContactMethod) {
      throw new Error('User contact method not found');
    }

    // Prepare data for update
    const updateData: Prisma.UserContactMethodUpdateInput = {};

    if (input.value) updateData.value = input.value;
    if (input.url !== undefined) updateData.url = input.url;

    // Update user contact method
    const updatedUserContactMethod = await ctx.prisma.userContactMethod.update({
      where: { id: input.id },
      data: updateData,
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
        id: updatedUserContactMethod.id,
        userId: updatedUserContactMethod.userId,
        contactMethodId: updatedUserContactMethod.contactMethodId,
        value: updatedUserContactMethod.value,
        url: updatedUserContactMethod.url,
        createdAt: updatedUserContactMethod.createdAt,
        updatedAt: updatedUserContactMethod.updatedAt,
        method: updatedUserContactMethod.method,
      },
    };
  });
