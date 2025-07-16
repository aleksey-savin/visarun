import { PrismaClient } from '@prisma/client';
import { type Request, type Response } from 'express';
import { type TokenPayload } from '../utils/jwt.js';
import { createAuditMiddleware } from '../middleware/audit.js';

const prisma = new PrismaClient();

// Apply audit middleware to Prisma client
prisma.$use(createAuditMiddleware());

// Combined context type that includes auth
export type AppContext = {
  prisma: PrismaClient;
  req?: Request;
  res?: Response;
  user?: TokenPayload; // From auth middleware
  stop: () => Promise<void>;
};

// Create the base context without user information
export const createAppContext = ({
  req,
  res,
}: { req?: Request; res?: Response } = {}): AppContext => {
  return {
    prisma,
    req,
    res,
    stop: async () => {
      await prisma.$disconnect();
    },
  };
};
