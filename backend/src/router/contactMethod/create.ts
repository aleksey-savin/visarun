import { adminProcedure } from '../../lib/trpc.js';
import { z } from 'zod';

export const zCreateContactMethodTrpcInput = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
});

export const createContactMethodTrpcRoute = adminProcedure
  .input(zCreateContactMethodTrpcInput)
  .mutation(async ({ input, ctx }) => {
    const existingContactMethod = await ctx.prisma.contactMethod.findUnique({
      where: { name: input.name },
    });

    if (existingContactMethod) {
      throw new Error('Contact method with this name already exists');
    }

    const contactMethod = await ctx.prisma.contactMethod.create({
      data: {
        name: input.name,
        description: input.description,
      },
    });

    return {
      contactMethod: {
        id: contactMethod.id,
        name: contactMethod.name,
        description: contactMethod.description,
      },
    };
  });
