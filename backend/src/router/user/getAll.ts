import { z } from 'zod';
import { trpc } from '../../lib/trpc.js';

const zGetAllUsersTrpcInput = z.object({
  search: z.string().optional(),
  canAcceptPayments: z.boolean().optional(),
});

export const getAllUsersTrpcRoute = trpc.procedure
  .input(zGetAllUsersTrpcInput.optional())
  .query(async ({ ctx, input = {} }) => {
    const whereClause: {
      OR?: Array<{
        firstName?: { contains: string; mode: 'insensitive' };
        lastName?: { contains: string; mode: 'insensitive' };
        email?: { contains: string; mode: 'insensitive' };
      }>;
      roleAssignments?: {
        some: {
          role: {
            permissions: {
              some: {
                permission: {
                  code: {
                      in: string[]
                  };
                };
              };
            };
          };
        };
      };
    } = {};

    // Add search filter
    if (input.search) {
      whereClause.OR = [
        { firstName: { contains: input.search, mode: 'insensitive' } },
        { lastName: { contains: input.search, mode: 'insensitive' } },
        { email: { contains: input.search, mode: 'insensitive' } },
      ];
    }

    // Add payment permission filter
    if (input.canAcceptPayments) {
      whereClause.roleAssignments = {
        some: {
          role: {
            permissions: {
              some: {
                permission: {
                  code: {
                      in: [
                          'orderPayments.canAcceptPayments',
                          'global.fullAccess'
                      ]
                  },
                },
              },
            },
          },
        },
      };
    }

    const users = await ctx.prisma.user.findMany({
      where: whereClause,
      orderBy: { firstName: 'asc' },
      select: {
        id: true,
        firstName: true,
        middleName: true,
        lastName: true,
        email: true,
        createdAt: true,
        updatedAt: true,
        roleAssignments: {
          select: {
            id: true,
            assignedAt: true,
            role: {
              select: {
                id: true,
                name: true,
                description: true,
              },
            },
          },
          orderBy: {
            assignedAt: 'desc',
          },
        },
        contactMethods: {
          include: {
            method: {
              select: {
                id: true,
                name: true,
                description: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    return { users };
  });
