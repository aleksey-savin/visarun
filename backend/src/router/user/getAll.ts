import { z } from 'zod';
import { trpc } from '../../lib/trpc.js';

const zGetAllUsersTrpcInput = z.object({
  search: z.string().optional(),
  canAcceptPayments: z.boolean().optional(),
  limit: z.number().int().min(1).max(100).optional(),
  offset: z.number().int().min(0).default(0),
  excludeRoles: z.array(z.string()).optional(),
  includeRoles: z.array(z.string()).optional(),
});

export const getAllUsersTrpcRoute = trpc.procedure
  .input(zGetAllUsersTrpcInput.optional())
  .query(async ({ ctx, input }) => {
    const limit = input?.limit;
    const offset = input?.offset ?? 0;
    const search = input?.search;
    const canAcceptPayments = input?.canAcceptPayments;
    const excludeRoles = input?.excludeRoles;
    const includeRoles = input?.includeRoles;

    const whereClause: {
      OR?: Array<{
        firstName?: { contains: string; mode: 'insensitive' };
        lastName?: { contains: string; mode: 'insensitive' };
        email?: { contains: string; mode: 'insensitive' };
      }>;
      roleAssignments?: {
        some?: {
          role: {
            permissions?: {
              some: {
                permission: {
                  code: {
                    in: string[];
                  };
                };
              };
            };
            name?: {
              in: string[];
            };
          };
        };
        none?: {
          role: {
            name: {
              in: string[];
            };
          };
        };
      };
    } = {};

    // Add search filter
    if (search) {
      whereClause.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Add payment permission filter
    if (canAcceptPayments) {
      whereClause.roleAssignments = {
        some: {
          role: {
            permissions: {
              some: {
                permission: {
                  code: {
                    in: ['orderPayments.canAcceptPayments', 'global.fullAccess'],
                  },
                },
              },
            },
          },
        },
      };
    }

    // Add role exclusion filter
    if (excludeRoles && excludeRoles.length > 0) {
      if (!whereClause.roleAssignments) {
        whereClause.roleAssignments = {};
      }
      whereClause.roleAssignments.none = {
        role: {
          name: {
            in: excludeRoles,
          },
        },
      };
    }

    // Add role inclusion filter
    if (includeRoles && includeRoles.length > 0) {
      if (!whereClause.roleAssignments) {
        whereClause.roleAssignments = {};
      }
      whereClause.roleAssignments.some = {
        role: {
          name: {
            in: includeRoles,
          },
        },
      };
    }

    // Get total count
    const total = await ctx.prisma.user.count({
      where: whereClause,
    });

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
        Client: true,
      },
      ...(limit && { take: limit }),
      skip: offset,
    });

    return {
      users,
      pagination: {
        total,
        limit: limit || total,
        offset,
        hasMore: limit ? offset + limit < total : false,
      },
    };
  });
