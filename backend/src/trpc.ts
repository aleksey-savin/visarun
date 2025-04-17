import { initTRPC } from '@trpc/server';

const trpc = initTRPC.create();

const users = [
  {
    id: '1',
    title: 'John Doe',
    email: 'john.doe@example.com',
  },
  {
    id: '2',
    title: 'Jane Doe',
    email: 'jane.doe@example.com',
  },
  {
    id: '3',
    title: 'Bob Smith',
    email: 'bob.smith@example.com',
  },
  {
    id: '4',
    title: 'Alice Johnson',
    email: 'alice.johnson@example.com',
  },
];

export const TrpcRouter = trpc.router({
  getUsers: trpc.procedure.query(() => {
    return { users };
  }),
});
