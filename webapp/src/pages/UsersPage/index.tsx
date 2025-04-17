import { trpc } from '../../lib/trpcProvider';

const UsersPage = () => {
  const { data, error, isLoading, isError } = trpc.getUsers.useQuery();

  return (
    <>
      <h1>VisaRun</h1>
      {isLoading && <div>Loading...</div>}
      {data?.users && (
        <div>
          {data.users.map(user => (
            <div key={user.id}>{user.name}</div>
          ))}
        </div>
      )}
      {isError && <div>Error: {error.message}</div>}
    </>
  );
};

export default UsersPage;
