import { PrismaClient } from '@prisma/client';

export interface ClientWithRelatedClients {
  id: string;
  firstName: string | null;
  lastName: string | null;
  isPrimary: boolean;
  userId: string | null;
  citizenshipId: string | null;
  passportExpirationDate: Date | null;
  prevViolations: boolean;
  prevViolationsDesc: string | null;
  isOutsideTheCountry: boolean;
  isOutsideTheCountryAt: Date | null;
  user: {
    id: string;
    firstName: string;
    middleName: string | null;
    lastName: string;
    email: string | null;
    contactMethods: Array<{
      id: string;
      createdAt: Date;
      updatedAt: Date;
      userId: string;
      value: string;
      url: string | null;
      contactMethodId: string;
      method: {
        id: string;
        name: string;
        icon: string;
      };
    }>;
  } | null;
  citizenship: {
    id: string;
    name: string;
    abbreviation: string;
    emoji: string;
  } | null;
  documents?: Array<{
    id: string;
    fileName: string;
    originalName: string;
    fileUrl: string;
    fileType: string;
    fileSize: number;
    uploadedAt: Date;
    expiresAt: Date | null;
    tags: string[];
    comment: string | null;
    requirement: {
      id: string;
      title: string;
      description: string | null;
      serviceType: string;
      inputType: string;
    } | null;
    uploadedBy: {
      id: string;
      firstName: string;
      lastName: string;
      email: string | null;
    };
  }>;
  relatedClients: Array<{
    id: string;
    firstName: string | null;
    lastName: string | null;
    isPrimary: boolean;
  }>;
}

/**
 * Standard client selection fields for consistent querying
 */
export const clientSelectFields = {
  id: true,
  firstName: true,
  lastName: true,
  isPrimary: true,
  userId: true,
  citizenshipId: true,
  passportExpirationDate: true,
  prevViolations: true,
  prevViolationsDesc: true,
  isOutsideTheCountry: true,
  isOutsideTheCountryAt: true,
  user: {
    select: {
      id: true,
      firstName: true,
      middleName: true,
      lastName: true,
      email: true,
      contactMethods: {
        include: {
          method: {
            select: {
              id: true,
              name: true,
              icon: true,
            },
          },
        },
      },
    },
  },
  citizenship: {
    select: {
      id: true,
      name: true,
      abbreviation: true,
      emoji: true,
    },
  },
} as const;

/**
 * Extended client selection fields including documents
 */
export const clientSelectFieldsWithDocuments = {
  ...clientSelectFields,
  documents: {
    orderBy: {
      uploadedAt: 'desc' as const,
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
} as const;

/**
 * Fetches related clients based on isPrimary status:
 * - For primary clients: returns other non-primary clients for the same user
 * - For non-primary clients: returns the primary client for the same user
 */
export async function getRelatedClientsForUser(
  prisma: PrismaClient,
  userId: string | null,
  excludeClientId: string,
  isPrimary: boolean
): Promise<
  Array<{ id: string; firstName: string | null; lastName: string | null; isPrimary: boolean }>
> {
  if (!userId) {
    return [];
  }

  if (isPrimary) {
    // For primary clients, return other non-primary clients
    return await prisma.client.findMany({
      where: {
        userId: userId,
        isPrimary: false,
        id: { not: excludeClientId },
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        isPrimary: true,
      },
      orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }],
    });
  } else {
    // For non-primary clients, return the primary client
    const primaryClient = await prisma.client.findFirst({
      where: {
        userId: userId,
        isPrimary: true,
        id: { not: excludeClientId },
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        isPrimary: true,
      },
    });

    return primaryClient ? [primaryClient] : [];
  }
}

/**
 * Adds relatedClients field to a single client
 */
export async function addRelatedClientsToClient<
  T extends { id: string; userId: string | null; isPrimary: boolean },
>(
  prisma: PrismaClient,
  client: T
): Promise<
  T & {
    relatedClients: Array<{
      id: string;
      firstName: string | null;
      lastName: string | null;
      isPrimary: boolean;
    }>;
  }
> {
  const relatedClients = await getRelatedClientsForUser(
    prisma,
    client.userId,
    client.id,
    client.isPrimary
  );

  return {
    ...client,
    relatedClients,
  };
}

/**
 * Adds relatedClients field to an array of clients
 */
export async function addRelatedClientsToClientList<
  T extends { id: string; userId: string | null; isPrimary: boolean },
>(
  prisma: PrismaClient,
  clients: T[]
): Promise<
  Array<
    T & {
      relatedClients: Array<{
        id: string;
        firstName: string | null;
        lastName: string | null;
        isPrimary: boolean;
      }>;
    }
  >
> {
  return await Promise.all(
    clients.map(async client => {
      const relatedClients = await getRelatedClientsForUser(
        prisma,
        client.userId,
        client.id,
        client.isPrimary
      );
      return {
        ...client,
        relatedClients,
      };
    })
  );
}

/**
 * Fetches a single client with related clients included
 */
export async function getClientWithRelatedClients(
  prisma: PrismaClient,
  where: { id: string } | { userId: string },
  includeDocuments = false
): Promise<ClientWithRelatedClients | null> {
  const selectFields = includeDocuments ? clientSelectFieldsWithDocuments : clientSelectFields;

  let client;

  if ('userId' in where) {
    // When searching by userId, find the primary client specifically
    client = await prisma.client.findFirst({
      where: {
        userId: where.userId,
        isPrimary: true,
      },
      select: selectFields,
    });
  } else {
    // When searching by id, find the specific client
    client = await prisma.client.findFirst({
      where,
      select: selectFields,
    });
  }

  if (!client) {
    return null;
  }

  const relatedClients = await getRelatedClientsForUser(
    prisma,
    client.userId,
    client.id,
    client.isPrimary
  );

  return {
    ...client,
    relatedClients,
  } as ClientWithRelatedClients;
}

/**
 * Searches clients with related clients included
 */
export async function searchClientsWithRelatedClients(
  prisma: PrismaClient,
  searchQuery: string,
  limit = 50,
  offset = 0
): Promise<{
  clients: ClientWithRelatedClients[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}> {
  const where = {
    OR: [
      // Search by client first name
      {
        firstName: {
          contains: searchQuery,
          mode: 'insensitive' as const,
        },
      },
      // Search by client last name
      {
        lastName: {
          contains: searchQuery,
          mode: 'insensitive' as const,
        },
      },
      // Search by user email
      {
        user: {
          email: {
            contains: searchQuery,
            mode: 'insensitive' as const,
          },
        },
      },
      // Search by user first name
      {
        user: {
          firstName: {
            contains: searchQuery,
            mode: 'insensitive' as const,
          },
        },
      },
      // Search by user last name
      {
        user: {
          lastName: {
            contains: searchQuery,
            mode: 'insensitive' as const,
          },
        },
      },
      // Search by user contact methods
      {
        user: {
          contactMethods: {
            some: {
              value: {
                contains: searchQuery,
                mode: 'insensitive' as const,
              },
            },
          },
        },
      },
    ],
  };

  const [clients, total] = await Promise.all([
    prisma.client.findMany({
      where,
      select: clientSelectFields,
      orderBy: [
        {
          firstName: 'asc',
        },
        {
          lastName: 'asc',
        },
      ],
      take: limit,
      skip: offset,
    }),
    prisma.client.count({ where }),
  ]);

  const clientsWithRelatedClients = await addRelatedClientsToClientList(prisma, clients);

  return {
    clients: clientsWithRelatedClients as ClientWithRelatedClients[],
    pagination: {
      total,
      limit,
      offset,
      hasMore: offset + limit < total,
    },
  };
}
