import { serviceRequirementReadProcedure } from '../../lib/trpc.js';
import { z } from 'zod';
import { Prisma } from '@prisma/client';

export const zGetAllServiceRequirementsTrpcInput = z.object({
  limit: z.number().int().min(1).max(100).default(50),
  offset: z.number().int().min(0).default(0),
  serviceType: z.enum(['visa_application', 'visarun_order', 'document_service']).optional(),
  serviceId: z.string().uuid().optional(),
  requirementId: z.string().uuid().optional(),
  status: z.enum(['pending', 'submitted', 'approved', 'rejected', 'needs_revision']).optional(),
  clientId: z.string().uuid().optional(),
});

export const getAllServiceRequirementsTrpcRoute = serviceRequirementReadProcedure
  .input(zGetAllServiceRequirementsTrpcInput)
  .query(async ({ input, ctx }) => {
    const { limit, offset, serviceType, serviceId, requirementId, status, clientId } = input;

    // Build where clause
    const where: Prisma.ServiceRequirementWhereInput = {};

    if (serviceType) {
      where.serviceType = serviceType;
    }

    if (serviceId) {
      where.serviceId = serviceId;
    }

    if (requirementId) {
      where.requirementId = requirementId;
    }

    if (status) {
      where.status = status;
    }

    // Filter by client if provided
    if (clientId) {
      where.OR = [
        // If it's a visa application, filter by client through visa application
        {
          AND: [
            { serviceType: 'visa_application' },
            {
              serviceId: {
                in: await ctx.prisma.visaApplication
                  .findMany({
                    where: {
                      orderItem: {
                        clientId,
                      },
                    },
                    select: {
                      id: true,
                    },
                  })
                  .then(applications => applications.map(app => app.id)),
              },
            },
          ],
        },
        // Add other service types as needed
      ];
    }

    // Get total count
    const total = await ctx.prisma.serviceRequirement.count({
      where,
    });

    // Get service requirements
    const serviceRequirements = await ctx.prisma.serviceRequirement.findMany({
      where,
      orderBy: [{ status: 'asc' }, { submittedAt: 'desc' }],
      select: {
        id: true,
        requirementId: true,
        serviceType: true,
        serviceId: true,
        status: true,
        textValue: true,
        dateValue: true,
        booleanValue: true,
        checkpointValue: true,
        documentId: true,
        submittedAt: true,
        reviewedAt: true,
        reviewedById: true,
        comment: true,
        requirement: {
          select: {
            id: true,
            title: true,
            description: true,
            serviceType: true,
            inputType: true,
            operator: true,
            thresholdNumber: true,
            thresholdDate: true,
            thresholdText: true,
            thresholdBool: true,
            checkpointValue: true,
          },
        },
        document: {
          select: {
            id: true,
            fileName: true,
            originalName: true,
            fileUrl: true,
            fileType: true,
            fileSize: true,
            uploadedAt: true,
            isValid: true,
            expiresAt: true,
            tags: true,
            comment: true,
            client: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        reviewedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      take: limit,
      skip: offset,
    });

    return {
      serviceRequirements,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    };
  });
