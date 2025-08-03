import { PrismaClient, Prisma } from '@prisma/client';

/**
 * Sets a client as primary and ensures no other clients for the same user are primary
 * @param prisma - Prisma client instance
 * @param clientId - ID of the client to set as primary
 * @param userId - ID of the user (optional, will be fetched if not provided)
 */
export async function setPrimaryClient(
  prisma: PrismaClient,
  clientId: string,
  userId?: string
): Promise<void> {
  // Get the client if userId is not provided
  if (!userId) {
    const client = await prisma.client.findUnique({
      where: { id: clientId },
      select: { userId: true },
    });

    if (!client) {
      throw new Error('Client not found');
    }

    userId = client.userId || undefined;
  }

  // If no userId (client not associated with a user), just set as primary
  if (!userId) {
    await prisma.client.update({
      where: { id: clientId },
      data: { isPrimary: true },
    });
    return;
  }

  // Use a transaction to ensure consistency
  await prisma.$transaction(async tx => {
    // First, set all other clients for this user as not primary
    await tx.client.updateMany({
      where: {
        userId: userId,
        id: { not: clientId },
      },
      data: { isPrimary: false },
    });

    // Then set the specified client as primary
    await tx.client.update({
      where: { id: clientId },
      data: { isPrimary: true },
    });
  });
}

/**
 * Removes primary status from a client and optionally sets another client as primary
 * @param prisma - Prisma client instance
 * @param clientId - ID of the client to remove primary status from
 * @param newPrimaryClientId - Optional ID of client to set as new primary
 */
export async function removePrimaryClient(
  prisma: PrismaClient,
  clientId: string,
  newPrimaryClientId?: string
): Promise<void> {
  const client = await prisma.client.findUnique({
    where: { id: clientId },
    select: { userId: true, isPrimary: true },
  });

  if (!client) {
    throw new Error('Client not found');
  }

  if (!client.isPrimary) {
    return; // Already not primary
  }

  await prisma.$transaction(async tx => {
    // Remove primary status from the current client
    await tx.client.update({
      where: { id: clientId },
      data: { isPrimary: false },
    });

    // If a new primary client is specified, set it as primary
    if (newPrimaryClientId) {
      const newPrimaryClient = await tx.client.findUnique({
        where: { id: newPrimaryClientId },
        select: { userId: true },
      });

      if (!newPrimaryClient) {
        throw new Error('New primary client not found');
      }

      if (newPrimaryClient.userId !== client.userId) {
        throw new Error('New primary client must belong to the same user');
      }

      await tx.client.update({
        where: { id: newPrimaryClientId },
        data: { isPrimary: true },
      });
    } else if (client.userId) {
      // If no new primary is specified and the client has a userId,
      // automatically set the oldest remaining client as primary
      const oldestClient = await tx.client.findFirst({
        where: {
          userId: client.userId,
          id: { not: clientId },
        },
        orderBy: { id: 'asc' }, // Using id as a proxy for creation order
        select: { id: true },
      });

      if (oldestClient) {
        await tx.client.update({
          where: { id: oldestClient.id },
          data: { isPrimary: true },
        });
      }
    }
  });
}

/**
 * Gets the primary client for a user
 * @param prisma - Prisma client instance
 * @param userId - ID of the user
 * @returns The primary client or null if none exists
 */
export async function getPrimaryClient(
  prisma: PrismaClient,
  userId: string
): Promise<Prisma.ClientGetPayload<{
  include: {
    user: {
      select: {
        id: true;
        firstName: true;
        middleName: true;
        lastName: true;
        email: true;
      };
    };
    citizenship: {
      select: {
        id: true;
        name: true;
      };
    };
  };
}> | null> {
  return await prisma.client.findFirst({
    where: {
      userId: userId,
      isPrimary: true,
    },
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          middleName: true,
          lastName: true,
          email: true,
        },
      },
      citizenship: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });
}

/**
 * Ensures that each user has exactly one primary client
 * This is a utility function that can be used for data migration or cleanup
 * @param prisma - Prisma client instance
 */
export async function ensurePrimaryClientConsistency(prisma: PrismaClient): Promise<void> {
  // Get all users with their clients
  const usersWithClients = await prisma.user.findMany({
    include: {
      Client: {
        orderBy: { id: 'asc' }, // Using id as creation order proxy
      },
    },
  });

  for (const user of usersWithClients) {
    if (user.Client.length === 0) {
      continue; // No clients for this user
    }

    const primaryClients = user.Client.filter(client => client.isPrimary);

    if (primaryClients.length === 0) {
      // No primary client - set the first one as primary
      await prisma.client.update({
        where: { id: user.Client[0].id },
        data: { isPrimary: true },
      });
    } else if (primaryClients.length > 1) {
      // Multiple primary clients - keep only the first one
      await prisma.$transaction(async tx => {
        // Set all as not primary first
        await tx.client.updateMany({
          where: { userId: user.id },
          data: { isPrimary: false },
        });

        // Set the first one as primary
        await tx.client.update({
          where: { id: primaryClients[0].id },
          data: { isPrimary: true },
        });
      });
    }
    // If exactly one primary client exists, no action needed
  }

  // Handle clients without userId (set them all as primary since they're independent)
  await prisma.client.updateMany({
    where: { userId: null },
    data: { isPrimary: true },
  });
}
