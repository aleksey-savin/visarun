import { procedure } from '../../lib/trpc.js';
import { zSignUpTrpcInput } from './input.js';
import { hashPassword } from '../../utils/getPasswordHash.js';

export const signupTrpcRoute = procedure
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

    const hashedPassword = await hashPassword(input.password);

    const newUser = await ctx.prisma.user.create({
      data: {
        email: input.email,
        firstName: input.firstName,
        lastName: input.lastName,
        middleName: input.middleName,
        password: hashedPassword,
      },
    });

    // Don't return the password
    return { ...newUser, password: undefined };
  });
