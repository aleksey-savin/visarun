import { z } from 'zod';
import { trpc } from '../../lib/trpc.js';

export const getContactMethodTrpcRoute = trpc.procedure
  .input(z.object({ id: z.string() }))
  .query(async ({ ctx, input }) => {
    const contactMethod = await ctx.prisma.contactMethod.findUnique({
      where: { id: input.id },
      include: {
        assignments: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!contactMethod) {
      throw new Error(`Contact method ${input.id} not found`);
    }

    return { contactMethod };
  });
