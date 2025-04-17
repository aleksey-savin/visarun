import { initTRPC } from '@trpc/server';

const trpc = initTRPC.create();

const users = [
  {
    id: '1',
    name: 'John Doe',
    email: 'john.doe@example.com',
  },
  {
    id: '2',
    name: 'Jane Doe',
    email: 'jane.doe@example.com',
  },
  {
    id: '3',
    name: 'Bob Smithh',
    email: 'bob.smith@example.com',
  },
  {
    id: '4',
    name: 'Alice Johnson',
    email: 'alice.johnson@example.com',
  },
];

export const TrpcRouter = trpc.router({
  getUsers: trpc.procedure.query(() => {
    return { users };
  }),
});
