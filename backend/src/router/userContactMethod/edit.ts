import { userUpdateProcedure } from '../../lib/trpc.js';
import { z } from 'zod';
import { Prisma } from '@prisma/client';

export const zEditUserContactMethodTrpcInput = z.object({
  id: z.string().uuid(),
  contactMethodId: z.string().uuid().optional(),
  contactValue: z.string().min(1).max(500).optional(),
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

    // If contactMethodId is being changed, verify the new contact method exists
    if (
      input.contactMethodId &&
      input.contactMethodId !== existingUserContactMethod.contactMethodId
    ) {
      const newContactMethod = await ctx.prisma.contactMethod.findUnique({
        where: { id: input.contactMethodId },
      });

      if (!newContactMethod) {
        throw new Error('New contact method not found');
      }

      // Check if user already has the new contact method type
      const existingWithNewType = await ctx.prisma.userContactMethod.findUnique({
        where: {
          userId_contactMethodId: {
            userId: existingUserContactMethod.userId,
            contactMethodId: input.contactMethodId,
          },
        },
      });

      if (existingWithNewType && existingWithNewType.id !== input.id) {
        throw new Error('User already has this contact method type assigned');
      }
    }

    // Prepare data for update
    const updateData: Prisma.UserContactMethodUpdateInput = {};

    if (input.contactMethodId) {
      updateData.method = {
        connect: { id: input.contactMethodId },
      };
    }
    if (input.contactValue) updateData.value = input.contactValue;
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
