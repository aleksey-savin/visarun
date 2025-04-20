import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const createAppContext = () => {
  return {
    prisma,
    stop: async () => {
      await prisma.$disconnect();
    },
  };
};

export type AppContext = ReturnType<typeof createAppContext>;
