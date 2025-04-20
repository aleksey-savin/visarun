import crypto from 'crypto';
import { trpc } from '../../lib/trpc.ts';
import { zSignUpTrpcInput } from './input.ts';

export const signupTrpcRoute = trpc.procedure
  .input(zSignUpTrpcInput)
  .mutation(async ({ ctx, input }) => {
    const existingUser = await ctx.prisma.user.findUnique({
      where: {
        email: input.email,
      },
    });

    if (existingUser) {
      throw new Error('User already exists');
    }

    const hashedPassword = crypto.createHash('sha256').update(input.password).digest('hex');

    const newUser = await ctx.prisma.user.create({
      data: {
        email: input.email,
        firstName: input.firstName,
        lastName: input.lastName,
        middleName: input.middleName,
        password: hashedPassword,
      },
    });

    return newUser;
  });
