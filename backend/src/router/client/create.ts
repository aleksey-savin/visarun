import { userCreateProcedure } from '../../lib/trpc.js';
import { z } from 'zod';
import { createUserForClient } from '../../utils/userCreation.js';

// Contact method input schema
const zContactMethodInput = z.object({
  contactMethodId: z.string().uuid(),
  value: z.string().min(1).max(500),
  url: z.string().url().optional(),
});

// User data input schema (for when creating a new user)
const zUserDataInput = z.object({
  email: z.string().email().optional(),
  firstName: z.string().max(100),
  lastName: z.string().max(100),
  middleName: z.string().min(1).max(100).optional(),
  password: z.string().min(8).max(100).optional(),
  contactMethods: z.array(zContactMethodInput).optional(),
});

export const zCreateClientTrpcInput = z
  .object({
    userId: z.string().uuid().optional(),
    // Client data
    firstName: z.string().max(100),
    lastName: z.string().max(100),
    citizenshipId: z.string().uuid().optional(),
    prevViolations: z.boolean().default(false),
    prevViolationsDesc: z.string().optional(),
    isOutsideTheCountry: z.boolean().default(false),
    isOutsideTheCountryAt: z.date().optional(),
    // User data (only when userId is not provided)
    userData: zUserDataInput.optional(),
  })
  .refine(
    data => {
      // If no userId is provided, userData must be provided
      if (!data.userId) {
        if (!data.userData) {
          return false;
        }
        // Must have either email or at least one contact method
        const hasEmail = data.userData.email && data.userData.email.length > 0;
        const hasContactMethods =
          data.userData.contactMethods && data.userData.contactMethods.length > 0;
        return hasEmail || hasContactMethods;
      }
      return true;
    },
    {
      message:
        'When creating a client without userId, userData must be provided with either email or contact methods',
      path: ['userData'],
    }
  );

export const createClientTrpcRoute = userCreateProcedure
  .input(zCreateClientTrpcInput)
  .mutation(async ({ input, ctx }) => {
    let userId = input.userId;
    let createdUserResult = null;

    // If no userId provided, create a new user
    if (!userId && input.userData) {
      createdUserResult = await createUserForClient(ctx.prisma, {
        email: input.userData.email,
        firstName: input.userData.firstName,
        middleName: input.userData.middleName,
        lastName: input.userData.lastName,
        password: input.userData.password,
        contactMethods: input.userData.contactMethods,
      });

      userId = createdUserResult.user.id;
    }

    // Check if user exists if userId was provided
    if (input.userId) {
      const user = await ctx.prisma.user.findUnique({
        where: { id: input.userId },
      });

      if (!user) {
        throw new Error('User not found');
      }
    }

    // Check if citizenship exists if provided
    if (input.citizenshipId) {
      const citizenship = await ctx.prisma.citizenship.findUnique({
        where: { id: input.citizenshipId },
      });

      if (!citizenship) {
        throw new Error('Citizenship not found');
      }
    }

    // Determine if this should be the primary client
    let isPrimary = false;

    if (!input.userId) {
      // If no userId was provided originally (new user created), set as primary
      isPrimary = true;
    } else {
      // Check if this is the first client for this user
      const existingClientsCount = await ctx.prisma.client.count({
        where: { userId: input.userId },
      });

      isPrimary = existingClientsCount === 0;
    }

    // Create client
    const client = await ctx.prisma.client.create({
      data: {
        userId: userId,
        firstName: input.firstName,
        lastName: input.lastName,
        citizenshipId: input.citizenshipId,
        prevViolations: input.prevViolations,
        prevViolationsDesc: input.prevViolationsDesc,
        isOutsideTheCountry: input.isOutsideTheCountry,
        isOutsideTheCountryAt: input.isOutsideTheCountryAt,
        isPrimary: isPrimary,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            middleName: true,
            lastName: true,
            email: true,
            mustChangePassword: true,
          },
        },
        citizenship: {
          select: {
            id: true,
            name: true,
          },
        },
        documents: {
          orderBy: {
            uploadedAt: 'desc',
          },
          include: {
            requirement: {
              select: {
                id: true,
                title: true,
                description: true,
                serviceType: true,
                inputType: true,
              },
            },
            uploadedBy: {
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

    return {
      client,
      createdUser: createdUserResult
        ? {
            id: createdUserResult.user.id,
            email: createdUserResult.user.email,
            firstName: createdUserResult.user.firstName,
            middleName: createdUserResult.user.middleName,
            lastName: createdUserResult.user.lastName,
            isActive: createdUserResult.user.isActive,
            mustChangePassword: createdUserResult.user.mustChangePassword,
            contactMethods: createdUserResult.contactMethods,
          }
        : null,
    };
  });
