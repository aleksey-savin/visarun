import { adminProcedure } from '../../lib/trpc.js';
import { z } from 'zod';
import { Prisma } from '@prisma/client';

export const zEditContactMethodTrpcInput = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
});

export const editContactMethodTrpcRoute = adminProcedure
  .input(zEditContactMethodTrpcInput)
  .mutation(async ({ input, ctx }) => {
    // Verify contact method exists
    const existingContactMethod = await ctx.prisma.contactMethod.findUnique({
      where: { id: input.id },
    });

    if (!existingContactMethod) {
      throw new Error('Contact method not found');
    }

    // If name is being changed, check if it's already in use
    if (input.name && input.name !== existingContactMethod.name) {
      const contactMethodWithName = await ctx.prisma.contactMethod.findUnique({
        where: { name: input.name },
      });

      if (contactMethodWithName) {
        throw new Error('Name is already in use by another contact method');
      }
    }

    // Prepare data for update
    const updateData: Prisma.ContactMethodUpdateInput = {};

    if (input.name) updateData.name = input.name;
    if (input.description !== undefined) updateData.description = input.description;

    // Update contact method
    const updatedContactMethod = await ctx.prisma.contactMethod.update({
      where: { id: input.id },
      data: updateData,
    });

    return {
      contactMethod: {
        id: updatedContactMethod.id,
        name: updatedContactMethod.name,
        description: updatedContactMethod.description,
      },
    };
  });
